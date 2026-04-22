const { Review } = require('../models');

const postReview = async (req, res) => {
  try {
    const { album_id }           = req.params;
    const { rating, review_text } = req.validatedBody;
    const user_id                = req.user.id;

    // ── Check — user ne pehle review diya hai? ───────────────
    const existing = await Review.findOne({
      where: { user_id, album_id }
    });

    // if (existing) {
    //   return res.status(409).json({
    //     success: false,
    //     message: 'You have already reviewed this album'
    //   });
    // }

    // ── Review save karo ─────────────────────────────────────
    await Review.create({
      user_id,
      album_id,
      rating,
      review_text: review_text || null
    });

    res.status(201).json({
      success: true,
      message: 'Review posted successfully'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: `${err.message }`});
  }
};

module.exports = { postReview };