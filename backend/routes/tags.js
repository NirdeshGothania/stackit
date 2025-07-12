const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const { validateQuery, paginationSchema } = require('../utils/validation');

// GET /api/tags - Get all tags with usage statistics
router.get('/', validateQuery(paginationSchema), async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.validatedQuery;

    // Aggregate tags with usage count
    const tags = await Question.aggregate([
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 },
          questions: { $addToSet: '$_id' }
        }
      },
      { $sort: { count: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $project: {
          name: '$_id',
          count: 1,
          questionCount: { $size: '$questions' }
        }
      }
    ]);

    // Get total count for pagination
    const totalTags = await Question.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags' } },
      { $count: 'total' }
    ]);

    const total = totalTags.length > 0 ? totalTags[0].total : 0;

    res.json({
      tags,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        hasMore: (page * limit) < total
      }
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// GET /api/tags/popular - Get popular tags
router.get('/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const popularTags = await Question.aggregate([
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          name: '$_id',
          count: 1
        }
      }
    ]);

    res.json({ tags: popularTags });
  } catch (error) {
    console.error('Error fetching popular tags:', error);
    res.status(500).json({ error: 'Failed to fetch popular tags' });
  }
});

// GET /api/tags/search - Search tags
router.get('/search', async (req, res) => {
  try {
    const { q: query, limit = 10 } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const searchRegex = new RegExp(query, 'i');

    const matchingTags = await Question.aggregate([
      { $unwind: '$tags' },
      { $match: { tags: searchRegex } },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          name: '$_id',
          count: 1
        }
      }
    ]);

    res.json({ tags: matchingTags });
  } catch (error) {
    console.error('Error searching tags:', error);
    res.status(500).json({ error: 'Failed to search tags' });
  }
});

// GET /api/tags/:tagName - Get questions by tag
router.get('/:tagName', validateQuery(paginationSchema), async (req, res) => {
  try {
    const { tagName } = req.params;
    const { page = 1, limit = 10 } = req.validatedQuery;
    const userId = req.user ? req.user._id : null;

    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
      filter: 'newest',
      tag: tagName.toLowerCase(),
      userId: null
    };

    const questions = await Question.getQuestions(filters);

    // Add user vote information if authenticated
    if (userId) {
      questions.forEach(question => {
        const userVote = question.votes.find(v => v.userId.toString() === userId.toString());
        question.userVote = userVote ? userVote.vote : 0;
      });
    }

    // Get tag statistics
    const tagStats = await Question.aggregate([
      { $match: { tags: tagName.toLowerCase() } },
      {
        $group: {
          _id: null,
          questionCount: { $sum: 1 },
          totalViews: { $sum: '$viewCount' },
          totalVotes: { $sum: { $size: '$votes' } }
        }
      }
    ]);

    const stats = tagStats.length > 0 ? tagStats[0] : {
      questionCount: 0,
      totalViews: 0,
      totalVotes: 0
    };

    res.json({
      tag: tagName,
      stats,
      questions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: questions.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching questions by tag:', error);
    res.status(500).json({ error: 'Failed to fetch questions by tag' });
  }
});

module.exports = router; 