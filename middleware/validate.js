// middleware/validate.js
const validate = (schema) => (req, res, next) => {

  // ── Multer form-data ya JSON dono handle karo ───────────
  const body = req.body || {};

  // terms string "true" ko boolean mein convert karo
  if (body.terms === 'true')  body.terms = true;
  if (body.terms === 'false') body.terms = false;

  const { error, value } = schema.validate(body, {
    abortEarly: false
  });

  if (error) {
    const errors = {};
    error.details.forEach(err => {
      const field = err.path[0];
      errors[field] = err.message;
    });
    return res.status(422).json({ success: false, errors });
  }

  req.validatedBody = value;  // ✅ yahan set hota hai
  next();
};

module.exports = validate;