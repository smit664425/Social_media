const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   GET /api/users/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/users/follow/:id
// @desc    Follow/Unfollow user
// @access  Private
router.post('/follow/:id', auth, async (req, res) => {
    try {
        if (req.user.id === req.params.id) {
            return res.status(400).json({ msg: 'You cannot follow yourself' });
        }

        const userToFollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user.id);

        if (!userToFollow || !currentUser) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const isFollowing = currentUser.following.includes(req.params.id);

        if (isFollowing) {
            // Unfollow
            currentUser.following = currentUser.following.filter(
                (followId) => followId.toString() !== req.params.id
            );
            userToFollow.followers = userToFollow.followers.filter(
                (followerId) => followerId.toString() !== req.user.id
            );
        } else {
            // Follow
            currentUser.following.push(req.params.id);
            userToFollow.followers.push(req.user.id);
        }

        await currentUser.save();
        await userToFollow.save();

        res.json({ following: currentUser.following, isFollowing: !isFollowing });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
