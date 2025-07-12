const Joi = require('joi');

// Question validation schema
const questionSchema = Joi.object({
  title: Joi.string()
    .min(10)
    .max(300)
    .required()
    .messages({
      'string.min': 'Title must be at least 10 characters long',
      'string.max': 'Title cannot exceed 300 characters',
      'any.required': 'Title is required'
    }),
  content: Joi.string()
    .min(20)
    .required()
    .messages({
      'string.min': 'Content must be at least 20 characters long',
      'any.required': 'Content is required'
    }),
  tags: Joi.array()
    .items(Joi.string().min(1).max(20))
    .min(1)
    .max(5)
    .required()
    .messages({
      'array.min': 'At least one tag is required',
      'array.max': 'Maximum 5 tags allowed',
      'any.required': 'Tags are required'
    })
});

// Answer validation schema
const answerSchema = Joi.object({
  content: Joi.string()
    .min(20)
    .required()
    .messages({
      'string.min': 'Answer must be at least 20 characters long',
      'any.required': 'Answer content is required'
    })
});

// Vote validation schema
const voteSchema = Joi.object({
  vote: Joi.number()
    .valid(-1, 1)
    .required()
    .messages({
      'any.only': 'Vote must be either -1 (downvote) or 1 (upvote)',
      'any.required': 'Vote value is required'
    })
});

// Search validation schema
const searchSchema = Joi.object({
  q: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Search query must be at least 2 characters',
      'string.max': 'Search query cannot exceed 100 characters'
    }),
  filter: Joi.string()
    .valid('newest', 'most_voted', 'unanswered', 'most_viewed')
    .optional()
    .messages({
      'any.only': 'Invalid filter value'
    }),
  tag: Joi.string()
    .min(1)
    .max(20)
    .optional()
    .messages({
      'string.min': 'Tag must be at least 1 character',
      'string.max': 'Tag cannot exceed 20 characters'
    }),
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .optional()
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 50'
    })
});

// Pagination validation schema
const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    })
});

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    req.validatedData = value;
    next();
  };
};

// Query validation middleware factory
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query);
    
    if (error) {
      return res.status(400).json({
        error: 'Query validation error',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    req.validatedQuery = value;
    next();
  };
};

// Sanitize HTML content (basic)
const sanitizeHtml = (html) => {
  // Basic HTML sanitization - in production, use a proper library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

// Sanitize tags
const sanitizeTags = (tags) => {
  return tags
    .map(tag => tag.toLowerCase().trim().replace(/[^a-z0-9-]/g, ''))
    .filter(tag => tag.length > 0 && tag.length <= 20);
};

module.exports = {
  questionSchema,
  answerSchema,
  voteSchema,
  searchSchema,
  paginationSchema,
  validate,
  validateQuery,
  sanitizeHtml,
  sanitizeTags
}; 