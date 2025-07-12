const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Notification = require('../models/Notification');
const { authenticateToken, optionalAuth, isQuestionOwner } = require('../middleware/auth');
const { validate, validateQuery, sanitizeHtml, sanitizeTags } = require('../utils/validation');
const { questionSchema, voteSchema, searchSchema } = require('../utils/validation');

// GET /api/questions - List questions with pagination and filters
router.get('/', optionalAuth, validateQuery(searchSchema), async (req, res) => {
  try {
    const { page = 1, limit = 10, filter = 'newest', q: search, tag } = req.validatedQuery;
    const userId = req.user ? req.user._id : null;

    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
      filter,
      search,
      tag,
      userId: null // Don't filter by user for public listing
    };

    const questions = await Question.getQuestions(filters);

    // Add user vote information if authenticated
    if (userId) {
      questions.forEach(question => {
        const userVote = question.votes.find(v => v.userId.toString() === userId.toString());
        question.userVote = userVote ? userVote.vote : 0;
      });
    }

    res.json({
      questions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: questions.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// GET /api/questions/:id - Get single question with answers
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const questionId = req.params.id;
    const userId = req.user ? req.user._id : null;

    const question = await Question.findById(questionId)
      .populate('userId', 'displayName avatarUrl reputation')
      .populate('acceptedAnswerId', 'content userId')
      .lean();

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Increment view count
    await Question.findByIdAndUpdate(questionId, { $inc: { viewCount: 1 } });

    // Get answers for this question
    const answers = await Answer.getAnswersForQuestion(questionId, userId);

    // Add user vote information if authenticated
    if (userId) {
      const userVote = question.votes.find(v => v.userId.toString() === userId.toString());
      question.userVote = userVote ? userVote.vote : 0;
    }

    // Calculate vote count
    question.voteCount = question.votes.reduce((sum, vote) => sum + vote.vote, 0);

    res.json({
      question,
      answers
    });
  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({ error: 'Failed to fetch question' });
  }
});

// POST /api/questions - Create new question
router.post('/', authenticateToken, validate(questionSchema), async (req, res) => {
  try {
    const { title, content, tags } = req.validatedData;
    const userId = req.user._id;

    // Sanitize content and tags
    const sanitizedContent = sanitizeHtml(content);
    const sanitizedTags = sanitizeTags(tags);

    const question = new Question({
      title,
      content: sanitizedContent,
      tags: sanitizedTags,
      userId
    });

    await question.save();

    // Populate user info for response
    await question.populate('userId', 'displayName avatarUrl');

    res.status(201).json({
      message: 'Question created successfully',
      question: {
        id: question._id,
        title: question.title,
        content: question.content,
        tags: question.tags,
        userId: question.userId,
        createdAt: question.createdAt,
        voteCount: 0,
        answerCount: 0,
        viewCount: 0
      }
    });
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ error: 'Failed to create question' });
  }
});

// POST /api/questions/:id/vote - Vote on question
router.post('/:id/vote', authenticateToken, validate(voteSchema), async (req, res) => {
  try {
    const questionId = req.params.id;
    const { vote } = req.validatedData;
    const userId = req.user._id;

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Prevent voting on own question
    if (question.userId.toString() === userId.toString()) {
      return res.status(400).json({ error: 'Cannot vote on your own question' });
    }

    await question.addVote(userId, vote);

    // Update user reputation
    const User = require('../models/User');
    const questionOwner = await User.findById(question.userId);
    if (questionOwner) {
      questionOwner.reputation += vote;
      await questionOwner.save();
    }

    res.json({
      message: 'Vote recorded successfully',
      voteCount: question.votes.reduce((sum, v) => sum + v.vote, 0)
    });
  } catch (error) {
    console.error('Error voting on question:', error);
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

// POST /api/questions/:id/accept - Accept answer (question owner only)
router.post('/:id/accept', authenticateToken, isQuestionOwner, async (req, res) => {
  try {
    const { answerId } = req.body;
    const questionId = req.params.id;
    const userId = req.user._id;

    if (!answerId) {
      return res.status(400).json({ error: 'Answer ID is required' });
    }

    const answer = await Answer.findById(answerId);
    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    if (answer.questionId.toString() !== questionId) {
      return res.status(400).json({ error: 'Answer does not belong to this question' });
    }

    // Check if another answer is already accepted
    const question = await Question.findById(questionId);
    if (question.acceptedAnswerId && question.acceptedAnswerId.toString() !== answerId) {
      return res.status(400).json({ error: 'Another answer is already accepted' });
    }

    if (answer.isAccepted) {
      // Unaccept the answer
      await answer.unaccept();
      res.json({ message: 'Answer unaccepted successfully' });
    } else {
      // Accept the answer
      await answer.accept(userId);
      
      // Create notification for answer owner
      await Notification.createNotification({
        toUserId: answer.userId,
        fromUserId: userId,
        type: 'accept',
        questionId,
        answerId,
        content: `Your answer to "${question.title}" has been accepted!`
      });

      res.json({ message: 'Answer accepted successfully' });
    }
  } catch (error) {
    console.error('Error accepting answer:', error);
    res.status(500).json({ error: 'Failed to accept answer' });
  }
});

// PUT /api/questions/:id - Update question (owner only)
router.put('/:id', authenticateToken, isQuestionOwner, validate(questionSchema), async (req, res) => {
  try {
    const { title, content, tags } = req.validatedData;
    const questionId = req.params.id;

    // Sanitize content and tags
    const sanitizedContent = sanitizeHtml(content);
    const sanitizedTags = sanitizeTags(tags);

    const question = await Question.findByIdAndUpdate(
      questionId,
      {
        title,
        content: sanitizedContent,
        tags: sanitizedTags,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('userId', 'displayName avatarUrl');

    res.json({
      message: 'Question updated successfully',
      question
    });
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

// DELETE /api/questions/:id - Delete question (owner only)
router.delete('/:id', authenticateToken, isQuestionOwner, async (req, res) => {
  try {
    const questionId = req.params.id;

    // Delete all answers for this question
    await Answer.deleteMany({ questionId });

    // Delete all notifications related to this question
    await Notification.deleteMany({ questionId });

    // Delete the question
    await Question.findByIdAndDelete(questionId);

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

module.exports = router; 