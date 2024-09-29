require('dotenv').config()
const { PrismaClient } = require('@prisma/client');
const asyncHandler = require('express-async-handler');
const { body, validationResult, Result } = require("express-validator");
const bcryptjs = require('bcryptjs');
const jwt = require("jsonwebtoken");
const prisma = new PrismaClient();

const validateChat = [
    body('users')
        .isArray()
        .withMessage('users must be array')
        .custom((users) => {
            const uniqueUsers = new Set(users.map((user) => user.id));
            return uniqueUsers.size === users.length;
        })
        .withMessage('Array values must be unique')
        .custom((users) => {
            return users.length > 1
        })
        .withMessage('Chat must have at least two users'),
];

exports.getAllChats = asyncHandler(async(req, res, next) => {
    try {
        const allChats = await prisma.Chat.findMany({
            include: {
                messages: true,
                users: true,
            }
        });
        return res.json(allChats)
    } catch(e) {
        return res.status(500).send(`Failed to get all chats \n ${e}`)
    }
});

exports.getChat = asyncHandler(async(req, res, next) => {
    try {
        const oneChat = await prisma.Chat.findUnique({
            where: {
                id: req.params.chatId,
            },
            include: {
                messages: true,
                users: true,
            }
        });
        return res.json(oneChat);
    } catch(e) {
        return res.status(500).send(`Failed to get Chat \n ${e}`);
    }     
});

exports.postChat = [
    validateChat,
    asyncHandler(async(req, res, next) => {
    
        const { users, messages } = req.body;

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const existingChat = await prisma.Chat.findMany({
            where: {
                users: {
                    every: {
                        id: { in: users.map((user) => user.id) },
                    },
                },
            },
            include: {
                users: true,
            }
        });

        const exactMatchChat = existingChat.filter((chat) => {
            return chat.users.length === users.length
        })
        try {
            if (exactMatchChat.length !== 0) {
                return res.status(500).json({ message: 'Chat with these users already exists' })
            }

            if (!process.env.SECRET) {
                const error = new Error("There is no JWT Secret Key")
                return next(error);
            }
            
            const newChat = await prisma.Chat.create({
                data: {
                    users: {
                        connect: users.map((user) => {
                            ({ 
                                id: user.id,
                                username: user.username,
                                })
                        })
                    }
                },
            });
            return res.json(newChat);
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

exports.deleteChat = asyncHandler(async(req, res, next) => {
    try {
        const deleteChat = await prisma.Chat.delete({
            where: {
                id: req.params.chatId,
            }
        });
        return res.json(deleteChat)
    } catch (e) {
        return res.status(500).send(`Failed to delete Chat \n ${e}`);
    }
    });