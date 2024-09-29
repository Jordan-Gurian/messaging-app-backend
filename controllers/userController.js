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
        .withMessage('Username must be between 8 and 20 characters'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).+$/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character')
];

exports.getAllUsers = asyncHandler(async(req, res, next) => {
    try {
        const allUsers = await prisma.User.findMany();
        return res.json(allUsers)
    } catch(e) {
        return res.status(500).send(`Failed to get all users \n ${e}`)
    }
});

exports.getUser = asyncHandler(async(req, res, next) => {
    try {
        const oneUser = await prisma.User.findUnique({
            where: {
                id: req.params.userId,
            }
        });
        return res.json(oneUser);
    } catch(e) {
        return res.status(500).send(`Failed to get User \n ${e}`);
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

            const newUser = await prisma.User.create({
                data: {
                    username: username,
                    password: hashed,  
                },
            });

            jwt.sign({ newUser }, process.env.SECRET, { expiresIn: '10h' }, (err, token) => {
                res.json({ token });
            });
            
        } catch (e) {
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

exports.deleteUser = asyncHandler(async(req, res, next) => {
    try {
        const deleteUser = await prisma.User.delete({
            where: {
                id: req.params.userId,
            }
        });
        return res.json(deleteUser)
    } catch (e) {
        return res.status(500).send(`Failed to delete User \n ${e}`);
    }
    });