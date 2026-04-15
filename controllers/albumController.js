const axios  = require('axios');
const { Op } = require('sequelize');

const LASTFM_KEY  = process.env.LASTFM_API_KEY;
const LASTFM_URL  = 'https://ws.audioscrobbler.com/2.0/';

const PLAN_LIMITS = { club: 10, arena: 25, stadium: Infinity };

// ─────────────────────────────────────────
// GET TRENDING ALBUMS
// GET /albums/trending
// ─────────────────────────────────────────
const getTrendingAlbums = async (req, res) => {
  try {
    const { User, Album, Review, Comment, SavedAlbum } = req.app.get('models');

    const membership = req.user.membership;
    const limit      = PLAN_LIMITS[membership];

    if (!limit) {
      return res.status(403).json({ success: false, message: 'Invalid membership plan' });
    }

    // ── 1. Fetch trending tracks from Last.fm ─────────────────
    const chartResponse = await axios.get(LASTFM_URL, {
      params: {
        method:  'chart.getTopTracks',
        api_key: LASTFM_KEY,
        format:  'json',
        limit:   limit === Infinity ? 50 : limit
      }
    });

    const tracks = chartResponse.data.tracks.track;

    // ── 2. Fetch album details from Last.fm in parallel ───────
    const albumResponses = await Promise.all(
      tracks.map(track =>
        axios.get(LASTFM_URL, {
          params: {
            method:  'album.getInfo',
            artist:  track.artist.name,
            album:   track.album?.['#text'] || track.name,
            api_key: LASTFM_KEY,
            format:  'json'
          }
        }).catch(() => null)
      )
    );

    const validAlbums = albumResponses.filter(r => r && r.data?.album);

    // ── 3. Upsert albums into DB ──────────────────────────────
    const upsertedAlbums = await Promise.all(
      validAlbums.map(r => {
        const a = r.data.album;
        return Album.findOrCreate({
          where: { mbid: a.mbid || `${a.artist}::${a.name}` },
          defaults: {
            name:   a.name,
            artist: a.artist,
            cover:  a.image?.[3]?.['#text'] || ''
          }
        }).then(([album]) => ({ raw: a, dbAlbum: album }));
      })
    );

    const albumIds = upsertedAlbums.map(({ dbAlbum }) => dbAlbum.id);

    // ── 4. Fetch reviews, comments, savedAlbums in parallel ───
    const [allReviews, allComments, savedAlbums] = await Promise.all([
      Review.findAll({
        where:   { album_id: { [Op.in]: albumIds } },
        include: [{ model: User, attributes: ['username', 'avatar'] }]
      }),
      Comment.findAll({
        where:   { album_id: { [Op.in]: albumIds }, parent_id: null },
        include: [{ model: User, attributes: ['username', 'avatar'] }]
      }),
      SavedAlbum.findAll({                                  // only current user's saved albums
        where: {
          user_id:  req.user.id,
          album_id: { [Op.in]: albumIds }
        },
        attributes: ['album_id']
      })
    ]);

    // ── 5. Build a Set of saved album IDs for O(1) lookup ─────
    const savedAlbumIds = new Set(savedAlbums.map(s => s.album_id));

// ── 6. Group reviews + comments by album_id ───────────────
const reviewsByAlbum  = {};
const commentsByAlbum = {};

allReviews.forEach(r => {
  if (!reviewsByAlbum[r.album_id])  reviewsByAlbum[r.album_id]  = [];
  reviewsByAlbum[r.album_id].push(r);
});

allComments.forEach(c => {
  if (!commentsByAlbum[c.album_id]) commentsByAlbum[c.album_id] = [];
  commentsByAlbum[c.album_id].push(c);
});

// ── 7. Shape final response ───────────────────────────────
const albums = upsertedAlbums.map(({ dbAlbum }) => {

  const reviews = (reviewsByAlbum[dbAlbum.id] || []).map(r => ({
    id:           r.id,
    personImage:  r.User?.avatar   || '',
    personName:   r.User?.username || 'Anonymous',
    dateOfRating: r.createdAt,
    rating:       parseFloat(r.rating),
    reviewBody:   r.review_text    || ''
  }));

  const comments = (commentsByAlbum[dbAlbum.id] || []).map(c => ({  // ← was: replies
    id:          c.id,
    image:       c.User?.avatar   || '',
    name:        c.User?.username || 'Anonymous',
    commentText: c.text,                                              // ← was: replieText
    commentTime: c.createdAt                                          // ← was: replieTime
  }));

  const averageRating = reviews.length
    ? parseFloat(
        (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      )
    : 0.0;

  return {
    id:               dbAlbum.id,
    image:            dbAlbum.cover,
    albumName:        dbAlbum.name,
    albumArtistName:  dbAlbum.artist,
    releaseDate:      dbAlbum.createdAt,
    averageRating,
    totalRatingCount: reviews.length,
    reviews,
    comments,                                                         // ← was: replies
    isSaved:          savedAlbumIds.has(dbAlbum.id),
    albumPlayLink:    `https://www.last.fm/music/${encodeURIComponent(dbAlbum.artist)}/${encodeURIComponent(dbAlbum.name)}`
  };
});

    // ── 8. Apply plan limit ───────────────────────────────────
    const limitedAlbums = limit === Infinity ? albums : albums.slice(0, limit);

    res.json({
      success:    true,
      plan:       membership,
      plan_limit: limit === Infinity ? 'unlimited' : limit,
      total:      limitedAlbums.length,
      data:       limitedAlbums
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getTrendingAlbums };