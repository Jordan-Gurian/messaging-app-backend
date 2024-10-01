require('dotenv').config()
const { PrismaClient } = require('@prisma/client');
const asyncHandler = require('express-async-handler');
const { body, validationResult, Result } = require("express-validator");
const bcryptjs = require('bcryptjs');
const jwt = require("jsonwebtoken");
const prisma = new PrismaClient();

const validateCredentials = [
    body('username')
        .not()
        .isEmpty()
        .withMessage('Username cannot be empty'),
    body('password')
        .not()
        .isEmpty()
        .withMessage('Password cannot be empty'),
];

exports.loginUser = [
    validateCredentials,
    asyncHandler(async (req, res, next) => {

        const { username, password } = req.body;
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const user = await prisma.User.findUnique({
            where: {
                username: username,
            },
            include: {
                following: true,
                followedBy: true
            }
        }); 

        if (user === null) {
            return res.status(500).json({ message: `Username or password is incorrect` })
        }

        try {
            const hashed = user.password
            const passwordMatches = await bcryptjs.compare(password, hashed)

            if (user === null || !passwordMatches) {
                return res.status(401).json({ message: `Username or password is incorrect` });
            }

            if (!process.env.SECRET) {
                const error = new Error("There is no JWT Secret Key")
                return next(error);
            }

            const token = jwt.sign({ user }, process.env.SECRET, { expiresIn: '10h' });   
            return res.json({ token });
            
        } catch (error) {
            if (error instanceof Error) {
            const payload = {
                errorMessage: error.message
            }
            return res.status(500).json(payload)
            }
            throw error
        }
    })
];