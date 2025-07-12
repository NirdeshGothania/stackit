const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const { authenticateToken } = require('../middleware/auth');

// GET /api/auth/profile - Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId)
      .populate('questionCount')
      .populate('answerCount');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's recent activity
    const recentQuestions = await Question.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title createdAt voteCount answerCount');

    const recentAnswers = await Answer.find({ userId })
      .populate('questionId', 'title')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('content createdAt voteCount questionId');

    res.json({
      user: {
        id: user._id,
        displayName: user.displayName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        reputation: user.reputation,
        badges: user.badges,
        joinDate: user.joinDate,
        lastSeen: user.lastSeen
      },
      stats: {
        questionCount: await Question.countDocuments({ userId }),
        answerCount: await Answer.countDocuments({ userId }),
        totalVotes: user.reputation - 1 // Starting reputation is 1
      },
      recentActivity: {
        questions: recentQuestions,
        answers: recentAnswers
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// PUT /api/auth/profile - Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { displayName, avatarUrl } = req.body;

    // Validate display name
    if (displayName && (displayName.length < 2 || displayName.length > 50)) {
      return res.status(400).json({ error: 'Display name must be between 2 and 50 characters' });
    }

    const updateData = {};
    if (displayName) updateData.displayName = displayName.trim();
    if (avatarUrl) updateData.avatarUrl = avatarUrl;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-__v');

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        displayName: user.displayName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        reputation: user.reputation,
        badges: user.badges,
        joinDate: user.joinDate,
        lastSeen: user.lastSeen
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// GET /api/auth/users/:userId - Get public user profile
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's questions and answers
    const questions = await Question.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title createdAt voteCount answerCount viewCount');

    const answers = await Answer.find({ userId })
      .populate('questionId', 'title')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('content createdAt voteCount isAccepted questionId');

    res.json({
      user: {
        id: user._id,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        reputation: user.reputation,
        badges: user.badges,
        joinDate: user.joinDate
      },
      stats: {
        questionCount: await Question.countDocuments({ userId }),
        answerCount: await Answer.countDocuments({ userId }),
        totalVotes: user.reputation - 1
      },
      recentActivity: {
        questions,
        answers
      }
    });
  } catch (error) {
    console.error('Error fetching public user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// GET /api/auth/users/:userId/questions - Get user's questions
router.get('/users/:userId/questions', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const questions = await Question.getQuestions({
      page: parseInt(page),
      limit: parseInt(limit),
      filter: 'newest',
      userId
    });

    res.json({
      questions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: questions.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user questions:', error);
    res.status(500).json({ error: 'Failed to fetch user questions' });
  }
});

// GET /api/auth/users/:userId/answers - Get user's answers
router.get('/users/:userId/answers', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const answers = await Answer.find({ userId })
      .populate('questionId', 'title')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    // Add vote count to each answer
    answers.forEach(answer => {
      answer.voteCount = answer.votes.reduce((sum, vote) => sum + vote.vote, 0);
    });

    res.json({
      answers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: answers.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user answers:', error);
    res.status(500).json({ error: 'Failed to fetch user answers' });
  }
});

// POST /api/auth/update-last-seen - Update user's last seen
router.post('/update-last-seen', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
    res.json({ message: 'Last seen updated' });
  } catch (error) {
    console.error('Error updating last seen:', error);
    res.status(500).json({ error: 'Failed to update last seen' });
  }
});

// POST /api/auth/fcm-token - Update FCM token
router.post('/fcm-token', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ error: 'FCM token is required' });
    }

    await User.findByIdAndUpdate(userId, { fcmToken });
    res.json({ message: 'FCM token updated successfully' });
  } catch (error) {
    console.error('Error updating FCM token:', error);
    res.status(500).json({ error: 'Failed to update FCM token' });
  }
});

module.exports = router; 