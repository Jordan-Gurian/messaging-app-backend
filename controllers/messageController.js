require('dotenv').config()
const { PrismaClient } = require('@prisma/client');
const asyncHandler = require('express-async-handler');
const { body, validationResult, Result } = require("express-validator");
const bcryptjs = require('bcryptjs');
const jwt = require("jsonwebtoken");
const prisma = new PrismaClient();

const validateMessage = [
    body('content')
        .isLength({ min: 1, max: 200 })
        .withMessage('Message must be between 1 and 200 characters'),
    body('authorId')
        .not()
        .isEmpty()
        .withMessage('Message must have author'),
    body('chatId')
        .not()
        .isEmpty()
        .withMessage('Message must be part of chat'),
];

exports.getAllMessages = asyncHandler(async(req, res, next) => {
    try {
        const allMessages = await prisma.Message.findMany();
        return res.json(allMessages)
    } catch(e) {
        return res.status(404).json({ error: `${e.message}` });
    }
});

exports.getMessage = asyncHandler(async(req, res, next) => {
    try {
        const oneMessage = await prisma.Message.findUnique({
            where: {
                id: req.params.messageId,
            }
        });
        return res.json(oneMessage);
    } catch(e) {
        return res.status(404).json({ error: `${e.message}` });
    }     
});

exports.postMessage = [
    validateMessage,
    asyncHandler(async(req, res, next) => {
        const { content, authorId, chatId } = req.body;
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // This query finds a Chat with chatId that contains the User with authorId.
        // If no such Chat exists, it will error out
        const currentChat = await prisma.Chat.findUnique({
            where: {
                id: chatId,
                users: {
                    some: {
                        id: authorId,
                    },
                },
            },
            include: {
                users: true,
            }
        });

        try {
            if (currentChat === null) {
                return res.status(500).send(`Chat does not exist, or it exists but user is not in it`)
            }

            if (!process.env.SECRET) {
                const error = new Error("There is no JWT Secret Key")
                return next(error);
            }

            const newMessage = await prisma.Message.create({
                data: {
                    content:  content,
                    authorId: authorId,
                    chatId:   chatId,  
                },
            }); 
            return res.json(newMessage)
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

exports.deleteMessage = asyncHandler(async(req, res, next) => {
    try {
        const deleteMessage = await prisma.Message.delete({
            where: {
                id: req.params.messageId,
            }
        });
        return res.json(deleteMessage)
    } catch (e) {
        return res.status(500).json({ error: `${e.message}` });
    }
    });