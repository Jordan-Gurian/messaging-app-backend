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
                messages: {
                    include: {
                        author: true,
                    }
                },
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
                        username: { 
                            in: users.map((user) => user.username) 
                        },
                    },
                },
            },
            include: {
                users: true,
            }
        });

        const exactMatchChat = existingChat.filter((chat) => {
            const chatUsernames = chat.users.map((user) => user.username);
            return (
                chatUsernames.length === users.length &&
                chatUsernames.every((username) => users.map((user) => user.username).includes(username))
            );
        });

        try {
            if (exactMatchChat.length !== 0) {
                return res.status(500).json({ error: 'Chat with these users already exists' })
            }

            if (!process.env.SECRET) {
                const error = new Error("There is no JWT Secret Key")
                return next(error);
            }
            const newChat = await prisma.Chat.create({
                data: {
                    users: {
                        connect: users.map((user) => ({
                            id: user.id,
                        }))
                    },
                },
                include: {
                    users: true,
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

exports.updateChat = asyncHandler(async(req, res, next) => {
    
    const { name } = req.body;
    
    try {
        const updatedChat = await prisma.Chat.update({
            where: {
                id: req.params.chatId,
            },
            data: {
                name
            },
            include: {
                users: true,
                messages: {
                    include: {
                        author: true,
                    }
                },
            }
        });
        return res.json(updatedChat)
    } catch (e) {
        return res.status(500).send(`Failed to update Chat \n ${e}`);
    }
}); 

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