require('dotenv').config()
const { PrismaClient } = require('@prisma/client');
const asyncHandler = require('express-async-handler');
const { body, validationResult, Result } = require("express-validator");
const bcryptjs = require('bcryptjs');
const jwt = require("jsonwebtoken");
const prisma = new PrismaClient();

const validatePost = [
    body('content')
        .isLength({ min: 1, max: 500 })
        .withMessage('Post must be between 1 and 500 characters'),
    body('authorId')
        .not()
        .isEmpty()
        .withMessage('Post must have author'),
];

exports.getPost = asyncHandler(async(req, res, next) => {
    try {
        const onePost = await prisma.Post.findUnique({
            where: {
                id: req.params.postId,
            },
            include: {
                usersThatLiked: true,
                comments: {
                    orderBy: [
                        {
                            usersThatLiked: {
                                _count: 'desc',
                            },
                        },
                        { date: 'desc' }
                    ],
                },
            }
        });
        return res.json(onePost);
    } catch(e) {
        return res.status(404).json({ error: `${e.message}` });
    }     
});

exports.postPost = [
    validatePost,
    asyncHandler(async(req, res, next) => {
        const { content, authorId } = req.body;
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Manual check for author existence
        const author = await prisma.User.findUnique({
            where: { id: authorId },
        });

        if (!author) {
            return res.status(400).json({ error: "Author does not exist" });
        }

        try {
            if (!process.env.SECRET) {
                const error = new Error("There is no JWT Secret Key")
                return next(error);
            }

            const newPost = await prisma.Post.create({
                data: {
                    content:  content,
                    authorId: authorId,
                },
            }); 
            return res.json(newPost)
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

exports.updatePost = asyncHandler(async(req, res, next) => {
    
    const { content, comments, usersThatLikedToAdd, usersThatLikedToRemove } = req.body;
    const postId = req.params.postId;

    const updateData = {};
    if (content !== undefined) updateData.content = content;
    if (comments !== undefined) updateData.comments = comments;
    if (usersThatLikedToAdd !== undefined) {
        updateData.usersThatLiked = {
            connect: {
                username: usersThatLikedToAdd, // Add user with username defined by usersThatLikedToAdd
            },
        };
    }
    
    if (usersThatLikedToRemove !== undefined) {
        updateData.usersThatLiked = {
            ...updateData.usersThatLiked,
            disconnect: {
                username: usersThatLikedToRemove, // Remove user with username defined by usersThatLikedToRemove
            },
        };
    }
    try {
        const updatedPost = await prisma.Post.update({
            where: {
                id: postId,
            },
            data: updateData,
            include: {
                usersThatLiked: true,
                comments: true,
            },
        });
        return res.json(updatedPost)
    } catch (e) {
        console.log(e.message)
        return res.status(500).json({ error: `${e.message}` });
    }
}); 

exports.deletePost = asyncHandler(async(req, res, next) => {
    try {
        const deletePost = await prisma.Post.delete({
            where: {
                id: req.params.postId,
            }
        });
        return res.json(deletePost)
    } catch (e) {
        return res.status(500).json({ error: `${e.message}` });
    }
    });