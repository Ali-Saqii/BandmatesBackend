const Joi = require('joi');

const postCommentSchema = Joi.object({
  text: Joi.string()
    .min(1)
    .max(500)
    .trim()
    .required()
    .messages({
      'string.empty':  'Comment text is required',
      'string.min':    'Comment must be at least 1 character',
      'string.max':    'Comment must not exceed 500 characters',
      'any.required':  'Comment text is required'
    }),

  parent_id: Joi.string()
    .uuid()
    .optional()
    .allow(null)
    .messages({
      'string.guid': 'parent_id must be a valid UUID'
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

module.exports = { postCommentSchema, validateBody };