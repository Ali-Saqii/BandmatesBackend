// routes/ranking.js
const express = require('express');
const router  = express.Router();
const { Album, Review } = require('../models');

router.get('/api/ranking', async (req, res) => {
  try {

    const albums = await Album.findAll({
      include: [{
        model: Review,
        attributes: ['rating']   // sirf rating chahiye, baki nahi
      }]
    });

    const rankingData = albums
      .map(album => {
        const reviews = album.Reviews || [];
        if (reviews.length === 0) return null;

        // Distribution [1★, 2★, 3★, 4★, 5★]
        const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviews.forEach(r => {
          const star = Math.min(5, Math.max(1, Math.round(parseFloat(r.rating))));
          dist[star]++;
        });

        // Average
        const sum = reviews.reduce((acc, r) => acc + parseFloat(r.rating), 0);
        const avg = (sum / reviews.length).toFixed(1);

        return {
          id:                  album.id,       // UUID — aapka album_id
          mbid:                album.mbid,
          name:                album.name,
          artist:              album.artist,
          cover:               album.cover,
          year:                album.year,
          avg_rating:          parseFloat(avg),
          total_reviews:       reviews.length,
          rating_distribution: [dist[1], dist[2], dist[3], dist[4], dist[5]]
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.avg_rating - a.avg_rating);

    res.json({ success: true, data: rankingData });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;