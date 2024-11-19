require('dotenv').config()
const { PrismaClient } = require('@prisma/client');
const asyncHandler = require('express-async-handler');
const { body, validationResult, Result } = require("express-validator");
const bcryptjs = require('bcryptjs');
const jwt = require("jsonwebtoken");
const prisma = new PrismaClient();

const validateUser = [
    body('username')
        .isLength({min: 8, max: 20})
        .withMessage('Username must be between 8 and 20 characters')
        .matches(/^[A-Za-z0-9]+$/)
        .withMessage('Username can only contain letters and numbers'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).+$/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
    body('profile_bio')
        .isLength({ max: 500 })
        .withMessage('Bio cannot be more than 500 characters')
];

exports.getAllUsers = asyncHandler(async(req, res, next) => {
    try {
        const allUsers = await prisma.User.findMany({
            include: {
                following: true,
                followedBy: true,
                chats: { 
                    include: { 
                        users: true,
                        messages: true,
                    }
                },
            }
        });
        return res.json(allUsers)
    } catch(e) {
        return res.status(404).json({ error: `${e.message}` });
    }
});

exports.getUser = asyncHandler(async(req, res, next) => {
    try {
        const oneUser = await prisma.User.findUnique({
            where: {
                username: req.params.username,
            },
            include: {
                following: true,
                followedBy: true,
                chats: { 
                    include: { 
                        users: true,
                        messages: true,
                    }
                },
            }
        });
        if (!oneUser) {
            throw new Error(`User with username "${req.params.username}" not found`);
        }

        return res.json(oneUser);
    } catch(e) {
        return res.status(404).json({ error: `${e.message}` });
    }     
});

exports.postUser = [
    validateUser,
    asyncHandler(async(req, res, next) => {
        const { username, password } = req.body;
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const existingUser = await prisma.User.findUnique({
            where: {
                username: username,
            }
        });

        try {
            if (existingUser !== null) {
                return res.status(500).json({ message: 'Username is already taken' })
            }

            if (!process.env.SECRET) {
                const error = new Error("There is no JWT Secret Key")
                return next(error);
            }

            const hashed = await bcryptjs.hash(req.body.password, 10);
            const user = await prisma.User.create({
                data: {
                    username: username,
                    password: hashed,
                },
            });

            jwt.sign({ user }, process.env.SECRET, { expiresIn: '10h' }, (err, token) => {
                res.json({ user, token });
            });
            
        } catch (e) {
            console.log(e)
            if (errors instanceof Error) {
            const payload = {
                errorMessage: e.message
            }
            return res.status(500).json(payload)
            }
            throw e
        }
    }
)];

exports.updateUserProfile = asyncHandler(async(req, res, next) => {
    
    const { password, profile_url, profile_bio } = req.body;

    if (!password && !profile_url && !profile_bio) {
        return res.status(500).send(`No valid profile update inputs provided in request`)
    }

    try {
        const updatedUser = await prisma.User.update({
            where: {
                username: req.params.username,
            },
            data: {
                password,
                profile_url,
                profile_bio,
            },
            include: {
                following: true,
                followedBy: true,
                chats: { 
                    include: { 
                        users: true,
                        messages: true,
                    }
                },
            }
        });
        return res.json(updatedUser)
    } catch (e) {
        return res.status(500).json({ error: `${e.message}` });
    }
}); 

exports.updateUserFollow = asyncHandler(async(req, res, next) => {
    const { usernameToFollow, isFollow } = req.body;
    
    if (isFollow === undefined) {
        return res.status(500).send(`Failed to make updates, req did not provide isFollow`);
    }

    if (usernameToFollow === req.params.username) {
        return res.status(500).send(`Failed to make updates, cannot follow/unfollow yourself`);
    }

    if (usernameToFollow) {
        const followingUser = await prisma.User.findUnique({
            where: {
                username: usernameToFollow,
            },
            include: {
                following: true,
                followedBy: true,
                chats: { 
                    include: { 
                        users: true,
                        messages: true,
                    }
                },
            }
        });

        if (!followingUser) {
            return res.status(500).json({ error: `${e.message}` });
        }
    }

    let updatedUser;
    try {

        // kind of clunky code, but ok for now
        if (isFollow) {
            updatedUser = await prisma.User.update({
                where: {
                    username: usernameToFollow,
                },
                data: {
                    followedBy: { connect: [{ username: req.params.username }] },
                },
                include: {
                    following: true,
                    followedBy: true,
                    chats: { 
                        include: { 
                            users: true,
                            messages: true,
                        }
                    },
                }
            });
        } else {
            updatedUser = await prisma.User.update({
                where: {
                    username: usernameToFollow,
                },
                data: {
                    followedBy: { disconnect: [{ username: req.params.username }] },
                },
                include: {
                    following: true,
                    followedBy: true,
                    chats: { 
                        include: { 
                            users: true,
                            messages: true,
                        }
                    },
                }
            });        }
    } catch (e) {
        return res.status(500).json({ error: `${e.message}` });
    }
    return res.json(updatedUser)
}); 

exports.deleteUser = asyncHandler(async(req, res, next) => {
    try {
        const deleteUser = await prisma.User.delete({
            where: {
                username: req.params.username,
            }
        });
        return res.json(deleteUser)
    } catch (e) {
        return res.status(500).json({ error: `${e.message}` });
    }
});