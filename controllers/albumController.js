
const axios = require("axios");
const { Op } = require("sequelize");

const LASTFM_URL = "https://ws.audioscrobbler.com/2.0/";
const LASTFM_KEY = process.env.LASTFM_API_KEY;

const PLAN_LIMITS = {
  club: 10,
  arena: 25,
  stadium: Infinity
};

const getTrendingAlbums = async (req, res) => {
  try {
    console.log("🔥 CONTROLLER HIT");
    console.log("🔑 LASTFM KEY:", LASTFM_KEY);

    const { User, Album, Review, Comment, SavedAlbum } =
      req.app.get("models");

    const membership = req.user?.membership || "club";
    const limit = PLAN_LIMITS[membership];

    // ─────────────────────────────
    // 1. FETCH TRENDING TRACKS
    // ─────────────────────────────
    const trackRes = await axios.get(LASTFM_URL, {
      params: {
        method: "chart.getTopTracks",
        api_key: LASTFM_KEY,
        format: "json",
        limit: 50
      }
    });

    const tracks = trackRes?.data?.tracks?.track || [];
    console.log("🎵 TRACKS:", tracks.length);

    // ─────────────────────────────
    // 2. GET ALBUM NAMES USING track.getInfo
    // ─────────────────────────────
    const albumPairs = await Promise.all(
      tracks.map(async (track) => {
        try {
          const infoRes = await axios.get(LASTFM_URL, {
            params: {
              method: "track.getInfo",
              artist: track.artist.name,
              track: track.name,
              api_key: LASTFM_KEY,
              format: "json"
            }
          });

          const albumName = infoRes?.data?.track?.album?.title;
          const artist = track.artist.name;

          if (!albumName || !artist) return null;

          return { artist, albumName };
        } catch {
          return null;
        }
      })
    );

    // Remove duplicates
    const uniqueAlbums = [
      ...new Map(
        albumPairs
          .filter(Boolean)
          .map((a) => [`${a.artist}-${a.albumName}`, a])
      ).values()
    ];

    console.log("💿 UNIQUE ALBUMS:", uniqueAlbums.length);

    if (!uniqueAlbums.length) {
      return res.json({
        success: true,
        plan: membership,
        total: 0,
        data: []
      });
    }

    // ─────────────────────────────
    // 3. FETCH ALBUM DETAILS (IMAGE + MBID)
    // ─────────────────────────────
    const albumDetails = await Promise.all(
      uniqueAlbums.map(async ({ artist, albumName }) => {
        try {
          const res = await axios.get(LASTFM_URL, {
            params: {
              method: "album.getInfo",
              artist,
              album: albumName,
              api_key: LASTFM_KEY,
              format: "json"
            }
          });

          const album = res?.data?.album;
          if (!album) return null;

          return {
            name: album.name,
            artist: album.artist,
            mbid: album.mbid || `${album.artist}::${album.name}`,
            cover:
              album.image?.find((img) => img.size === "extralarge")?.[
                "#text"
              ] || "",
            releaseDate: album.wiki?.published || new Date()
          };
        } catch {
          return null;
        }
      })
    );

    const validAlbums = albumDetails.filter(Boolean);
    console.log("✅ VALID ALBUMS:", validAlbums.length);

    // ─────────────────────────────
    // 4. UPSERT INTO DATABASE
    // ─────────────────────────────
    const upsertedAlbums = await Promise.all(
      validAlbums.map(async (a) => {
        const [album] = await Album.findOrCreate({
          where: { mbid: a.mbid },
          defaults: {
            name: a.name,
            artist: a.artist,
            cover: a.cover
          }
        });

        if (!album.cover && a.cover) {
          album.cover = a.cover;
          await album.save();
        }

        return album;
      })
    );

    const albumIds = upsertedAlbums.map((a) => a.id);

    // ─────────────────────────────
    // 5. FETCH RELATED DATA
    // ─────────────────────────────
    const [allReviews, allComments, savedAlbums] = await Promise.all([
      Review.findAll({
        where: { album_id: { [Op.in]: albumIds } },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["username", "avatar"]
          }
        ]
      }),
      Comment.findAll({
        where: {
          album_id: { [Op.in]: albumIds },
          parent_id: null
        },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["username", "avatar"]
          }
        ]
      }),
      SavedAlbum.findAll({
        where: {
          user_id: req.user?.id || 0,
          album_id: { [Op.in]: albumIds }
        }
      })
    ]);

    // Group reviews and comments
    const reviewsByAlbum = {};
    const commentsByAlbum = {};

    allReviews.forEach((r) => {
      if (!reviewsByAlbum[r.album_id]) reviewsByAlbum[r.album_id] = [];
      reviewsByAlbum[r.album_id].push(r);
    });

    allComments.forEach((c) => {
      if (!commentsByAlbum[c.album_id])
        commentsByAlbum[c.album_id] = [];
      commentsByAlbum[c.album_id].push(c);
    });

    const savedSet = new Set(savedAlbums.map((s) => s.album_id));

    // ─────────────────────────────
    // 6. FINAL RESPONSE (SwiftUI Compatible)
    // ─────────────────────────────
    const albums = upsertedAlbums.map((album) => {
      const reviews = (reviewsByAlbum[album.id] || []).map((r) => ({
        id: r.id,
        personImage: r.user?.avatar || "",
        personName: r.user?.username || "Anonymous",
        dateOfRating: r.createdAt,
        rating: parseFloat(r.rating || 0),
        reviewBody: r.review_text || ""
      }));

      const replies = (commentsByAlbum[album.id] || []).map((c) => ({
        id: c.id,
        image: c.user?.avatar || "",
        name: c.user?.username || "Anonymous",
        display_name: c.user?.displayName || "Anonymous", 
        commentText: c.text,
        commentTime: c.createdAt
      }));

      const averageRating =
        reviews.length > 0
          ? parseFloat(
              (
                reviews.reduce((sum, r) => sum + r.rating, 0) /
                reviews.length
              ).toFixed(1)
            )
          : 0;

      return {
        id: album.id,
        image: album.cover || "",
        albumName: album.name,
        albumArtistName: album.artist,
        releaseDate: album.createdAt,
        averageRating,
        totalRatingCount: reviews.length,
        reviews,
        replies,
        isSaved: savedSet.has(album.id),
        albumPlayLink: `https://www.last.fm/music/${encodeURIComponent(
          album.artist
        )}/${encodeURIComponent(album.name)}`
      };
    });

    const final =
      limit === Infinity ? albums : albums.slice(0, limit);

    return res.json({
      success: true,
      plan: membership,
      total: final.length,
      data: final
    });
  } catch (err) {
    console.error("❌ ERROR:", err.response?.data || err.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch albums",
      error: err.response?.data || err.message
    });
  }
};

module.exports = { getTrendingAlbums };