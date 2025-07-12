const express = require('express');
const router = express.Router();
const Answer = require('../models/Answer');
const Question = require('../models/Question');
const Notification = require('../models/Notification');
const { authenticateToken, isAnswerOwner } = require('../middleware/auth');
const { validate, sanitizeHtml } = require('../utils/validation');
const { answerSchema, voteSchema } = require('../utils/validation');

// GET /api/answers/question/:questionId - Get answers for a question
router.get('/question/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user ? req.user._id : null;

    const answers = await Answer.getAnswersForQuestion(questionId, userId);

    // Apply pagination
    const skip = (page - 1) * limit;
    const paginatedAnswers = answers.slice(skip, skip + limit);

    res.json({
      answers: paginatedAnswers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: answers.length,
        hasMore: skip + limit < answers.length
      }
    });
  } catch (error) {
    console.error('Error fetching answers:', error);
    res.status(500).json({ error: 'Failed to fetch answers' });
  }
});

// POST /api/answers - Create new answer
router.post('/', authenticateToken, validate(answerSchema), async (req, res) => {
  try {
    const { questionId, content } = req.body;
    const userId = req.user._id;

    // Validate question exists
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Check if user has already answered this question
    const existingAnswer = await Answer.findOne({ questionId, userId });
    if (existingAnswer) {
      return res.status(400).json({ error: 'You have already answered this question' });
    }

    // Sanitize content
    const sanitizedContent = sanitizeHtml(content);

    const answer = new Answer({
      questionId,
      userId,
      content: sanitizedContent
    });

    await answer.save();

    // Update question's answer count
    await question.updateAnswerCount();

    // Populate user info for response
    await answer.populate('userId', 'displayName avatarUrl reputation');

    // Create notification for question owner
    if (question.userId.toString() !== userId.toString()) {
      await Notification.createNotification({
        toUserId: question.userId,
        fromUserId: userId,
        type: 'answer',
        questionId,
        answerId: answer._id,
        content: `Someone answered your question "${question.title}"`
      });
    }

    res.status(201).json({
      message: 'Answer created successfully',
      answer: {
        id: answer._id,
        content: answer.content,
        userId: answer.userId,
        questionId: answer.questionId,
        createdAt: answer.createdAt,
        voteCount: 0,
        isAccepted: false
      }
    });
  } catch (error) {
    console.error('Error creating answer:', error);
    res.status(500).json({ error: 'Failed to create answer' });
  }
});

// POST /api/answers/:id/vote - Vote on answer
router.post('/:id/vote', authenticateToken, validate(voteSchema), async (req, res) => {
  try {
    const answerId = req.params.id;
    const { vote } = req.validatedData;
    const userId = req.user._id;

    const answer = await Answer.findById(answerId);
    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    // Prevent voting on own answer
    if (answer.userId.toString() === userId.toString()) {
      return res.status(400).json({ error: 'Cannot vote on your own answer' });
    }

    await answer.addVote(userId, vote);

    // Update user reputation
    const User = require('../models/User');
    const answerOwner = await User.findById(answer.userId);
    if (answerOwner) {
      answerOwner.reputation += vote;
      await answerOwner.save();
    }

    res.json({
      message: 'Vote recorded successfully',
      voteCount: answer.votes.reduce((sum, v) => sum + v.vote, 0)
    });
  } catch (error) {
    console.error('Error voting on answer:', error);
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

// PUT /api/answers/:id - Update answer (owner only)
router.put('/:id', authenticateToken, isAnswerOwner, validate(answerSchema), async (req, res) => {
  try {
    const answerId = req.params.id;
    const { content } = req.validatedData;

    // Sanitize content
    const sanitizedContent = sanitizeHtml(content);

    const answer = await Answer.findByIdAndUpdate(
      answerId,
      {
        content: sanitizedContent,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('userId', 'displayName avatarUrl');

    res.json({
      message: 'Answer updated successfully',
      answer
    });
  } catch (error) {
    console.error('Error updating answer:', error);
    res.status(500).json({ error: 'Failed to update answer' });
  }
});

// DELETE /api/answers/:id - Delete answer (owner only)
router.delete('/:id', authenticateToken, isAnswerOwner, async (req, res) => {
  try {
    const answerId = req.params.id;
    const answer = req.answer;

    // Update question's answer count
    const question = await Question.findById(answer.questionId);
    if (question) {
      await question.updateAnswerCount();
    }

    // Delete the answer
    await Answer.findByIdAndDelete(answerId);

    res.json({ message: 'Answer deleted successfully' });
  } catch (error) {
    console.error('Error deleting answer:', error);
    res.status(500).json({ error: 'Failed to delete answer' });
  }
});

// POST /api/answers/:id/accept - Accept answer (question owner only)
router.post('/:id/accept', authenticateToken, async (req, res) => {
  try {
    const answerId = req.params.id;
    const userId = req.user._id;

    const answer = await Answer.findById(answerId);
    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    // Check if user is the question owner
    const question = await Question.findById(answer.questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    if (question.userId.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Only question owner can accept answers' });
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
        questionId: answer.questionId,
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

module.exports = router; 