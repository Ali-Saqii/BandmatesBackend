const Joi = require('joi');

// SIGNUP SCHEMA
const signupSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .max(50)
    .trim()
    .required()
    .messages({
      'string.empty': 'Full name is required',
      'string.min':   'Name must be at least 3 characters',
      'string.max':   'Name must not exceed 50 characters',
      'any.required': 'Full name is required'
    }),

  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required'
    }),

  password: Joi.string()
    .min(8)
    .max(32)
    .pattern(/[A-Z]/, 'uppercase')
    .pattern(/[0-9]/, 'number')
    .pattern(/[!@#$%^&*]/, 'special')
    .required()
    .messages({
      'string.empty':        'Password is required',
      'string.min':          'Password must be at least 8 characters',
      'string.max':          'Password must not exceed 32 characters',
      'string.pattern.name': 'Password must contain at least one {#name} character',
      'any.required':        'Password is required'
    }),

  confirm_password: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'string.empty': 'Please confirm your password',
      'any.only':     'Passwords do not match',
      'any.required': 'Please confirm your password'
    }),

  terms: Joi.boolean()
    .valid(true)
    .required()
    .messages({
      'any.only':     'You must agree to the terms and conditions',
      'any.required': 'You must agree to the terms and conditions'
    })
});

// ─────────────────────────────────────────
// LOGIN SCHEMA
// ─────────────────────────────────────────
const loginSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required'
    }),

  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password is required',
      'any.required': 'Password is required'
    })
});

// VALIDATE HELPER FUNCTION
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false   // saare errors ek saath
  });

  if (error) {
    const errors = {};
    error.details.forEach(err => {
      const field = err.path[0];
      errors[field] = err.message;
    });
    return res.status(422).json({ success: false, errors });
  }

  req.validatedBody = value;  // clean data controller ko milega
  next();
};

module.exports = { signupSchema, loginSchema, validate };