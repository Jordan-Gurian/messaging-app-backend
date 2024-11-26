require('dotenv').config()
const { PrismaClient } = require('@prisma/client');
const asyncHandler = require('express-async-handler');
const { body, validationResult, Result } = require("express-validator");
const bcryptjs = require('bcryptjs');
const jwt = require("jsonwebtoken");
const prisma = new PrismaClient();

const validateComment = [
    body('content')
        .isLength({ min: 1, max: 250 })
        .withMessage('Comment must be between 1 and 250 characters'),
    body('authorId')
        .not()
        .isEmpty()
        .withMessage('Comment must have associated author'),
    body('postId')
        .not()
        .isEmpty()
        .withMessage('Comment must have associated post'),
];

exports.getComment = asyncHandler(async(req, res, next) => {
    try {
        const oneComment = await prisma.Comment.findUnique({
            where: {
                id: req.params.commentId,
            },
            include: {
                usersThatLiked: true,
                comments: true,
            }
        });
        return res.json(oneComment);
    } catch(e) {
        return res.status(404).json({ error: `${e.message}` });
    }     
});

exports.postComment = [
    validateComment,
    asyncHandler(async(req, res, next) => {
        const { content, authorId, postId, parentCommentId } = req.body;      
        
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Manual check for author existence
        const author = await prisma.User.findUnique({
            where: { id: authorId },
        });

        // Manual check for post existence
        const post = await prisma.Post.findUnique({
            where: { id: postId },
        });

        if (!author) {
            return res.status(400).json({ error: "Author does not exist" });
        }

        if (!post) {
            return res.status(400).json({ error: "Post does not exist" });
        }

        try {
            if (!process.env.SECRET) {
                const error = new Error("There is no JWT Secret Key")
                return next(error);
            }
            console.log(parentCommentId)

            const newComment = await prisma.Comment.create({
                    data: {
                        content:  content,
                        authorId: authorId,
                        postId: postId,
                        parentCommentId: parentCommentId || null,

                    },
                }); 
            return res.status(200).json(newComment)
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

exports.updateComment = asyncHandler(async(req, res, next) => {
    
    const { content, comments, usersThatLikedToAdd, usersThatLikedToRemove } = req.body;
    const commentId = req.params.commentId;

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
        await prisma.Comment.update({
            where: {
                id: commentId,
            },
            data: updateData,
            include: {
                usersThatLiked: true,
                comments: true,
            },
        });
        return res.status(200).json({ message: "Comment updated successfully" })
    } catch (e) {
        return res.status(500).json({ error: `${e.message}` });
    }
}); 

exports.fakeDeleteComment = asyncHandler(async(req, res, next) => {
    try {
        const commentId = req.params.commentId;
        await prisma.Comment.update({
            where: { 
                id: commentId 
            },
            data: { 
                isDeleted: true,
            },
        });
        return res.status(200).json({ message: "Comment deleted successfully" });
    } catch (e) {
        return res.status(500).json({ error: `${e.message}` });
    }
    });