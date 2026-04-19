const Joi = require('joi');

const postReviewSchema = Joi.object({
  rating: Joi.number()
    .min(1)
    .max(5)
    .precision(1)
    .required()
    .messages({
      'number.base':      'Rating must be a number',
      'number.min':       'Rating must be at least 1',
      'number.max':       'Rating must not exceed 5',
      'number.precision': 'Rating can have 1 decimal place only',
      'any.required':     'Rating is required'
    }),

  review_text: Joi.string()
    .min(1)
    .max(1000)
    .trim()
    .optional()
    .allow('')
    .messages({
      'string.min': 'Review must be at least 1 character',
      'string.max': 'Review must not exceed 1000 characters'
    })
});

const validateBody = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = {};
    error.details.forEach(err => {
      errors[err.path[0]] = err.message;
    });
    return res.status(422).json({ success: false, errors });
  }

  req.validatedBody = value;
  next();
};

module.exports = { postReviewSchema, validateBody };