const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   POST /api/posts
// @desc    Create a post
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const newPost = new Post({
            content: req.body.content,
            author: req.user.id
        });

        const post = await newPost.save();
        await post.populate('author', ['username']);
        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/posts
// @desc    Get all posts (Feed)
// @access  Public
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('author', ['username'])
            .populate('comments.user', ['username'])
            .sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/posts/user/:user_id
// @desc    Get posts by user ID
// @access  Public
router.get('/user/:user_id', async (req, res) => {
    try {
        const posts = await Post.find({ author: req.params.user_id })
            .populate('author', ['username'])
            .populate('comments.user', ['username'])
            .sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/posts/like/:id
// @desc    Like/Unlike a post
// @access  Private
router.put('/like/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        // Check if the post has already been liked by this user
        const isLiked = post.likes.includes(req.user.id);

        if (isLiked) {
            // Unlike
            post.likes = post.likes.filter((likeId) => likeId.toString() !== req.user.id);
        } else {
            // Like
            post.likes.unshift(req.user.id);
        }

        await post.save();
        res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/posts/comment/:id
// @desc    Comment on a post
// @access  Private
router.post('/comment/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        const newComment = {
            text: req.body.text,
            user: req.user.id
        };

        post.comments.unshift(newComment);
        await post.save();
        
        await post.populate('comments.user', ['username']);

        res.json(post.comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/posts/:id
// @desc    Delete a post (owner only)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ msg: 'Post not found' });

        // Make sure the logged-in user owns the post
        if (post.author.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorised to delete this post' });
        }

        await Post.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Post deleted' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Post not found' });
        res.status(500).send('Server Error');
    }
});

module.exports = router;

