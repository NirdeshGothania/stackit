const { verifyIdToken } = require('../config/firebase');
const User = require('../models/User');

// Middleware to authenticate Firebase ID token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify the Firebase ID token
    const decodedToken = await verifyIdToken(token);
    
    // Find or create user in our database
    const user = await User.findOrCreateFromFirebase({
      uid: decodedToken.uid,
      displayName: decodedToken.name || 'Anonymous',
      email: decodedToken.email,
      photoURL: decodedToken.picture
    });

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decodedToken = await verifyIdToken(token);
      const user = await User.findOrCreateFromFirebase({
        uid: decodedToken.uid,
        displayName: decodedToken.name || 'Anonymous',
        email: decodedToken.email,
        photoURL: decodedToken.picture
      });
      req.user = user;
    }
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Middleware to check if user is question owner
const isQuestionOwner = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const Question = require('../models/Question');
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    if (question.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied. Only question owner can perform this action.' });
    }

    req.question = question;
    next();
  } catch (error) {
    console.error('Question owner check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Middleware to check if user is answer owner
const isAnswerOwner = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const Answer = require('../models/Answer');
    const answer = await Answer.findById(req.params.id);

    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    if (answer.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied. Only answer owner can perform this action.' });
    }

    req.answer = answer;
    next();
  } catch (error) {
    console.error('Answer owner check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Middleware to check if user has minimum reputation
const requireReputation = (minReputation) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.reputation < minReputation) {
      return res.status(403).json({ 
        error: `Minimum reputation of ${minReputation} required for this action.` 
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  isQuestionOwner,
  isAnswerOwner,
  requireReputation
}; 