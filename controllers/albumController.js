
// const axios = require("axios");
// const { Op } = require("sequelize");

// const LASTFM_URL = "https://ws.audioscrobbler.com/2.0/";
// const LASTFM_KEY = process.env.LASTFM_API_KEY;

// const PLAN_LIMITS = {
//   club: 10,
//   arena: 25,
//   stadium: Infinity
// };

// const getTrendingAlbums = async (req, res) => {
//   try {
//     console.log("🔥 CONTROLLER HIT");

//     const { User, Album, Review, Comment, SavedAlbum } =
//       req.app.get("models");

//     const membership = req.user?.membership || "club";
//     const limit = PLAN_LIMITS[membership];

//     // 1. GET TOP TRACKS
//     const response = await axios.get(LASTFM_URL, {
//       params: {
//         method: "chart.getTopTracks",
//         api_key: LASTFM_KEY,
//         format: "json",
//         limit: 30
//       }
//     });

//     const tracks = response?.data?.tracks?.track || [];
//     console.log("🎵 TRACKS:", tracks.length);

//     // 2. SAFE ALBUM EXTRACTION (FIXED)
//     const albumsRaw = tracks
//       .map((t) => {
//         const artist = t.artist?.name;

//         const albumName =
//           t.album?.["#text"] ||
//           t.name || // fallback
//           null;

//         if (!artist || !albumName) return null;

//         return {
//           albumName: albumName.trim(),
//           artist: artist.trim()
//         };
//       })
//       .filter(Boolean);

//     console.log("💿 ALBUMS FOUND:", albumsRaw.length);

//     if (albumsRaw.length === 0) {
//       return res.json({
//         success: true,
//         message: "No albums found from Last.fm",
//         data: []
//       });
//     }

//     // 3. UPSERT INTO DB
//     const upsertedAlbums = await Promise.all(
//       albumsRaw.map(async (a) => {
//         const [album] = await Album.findOrCreate({
//           where: {
//             name: a.albumName,
//             artist: a.artist
//           },
//           defaults: {
//             cover: null
//           }
//         });

//         return album;
//       })
//     );

//     const albumIds = upsertedAlbums.map((a) => a.id);

//     // 4. FETCH RELATED DATA
//     const [allReviews, allComments, savedAlbums] = await Promise.all([
//       Review.findAll({
//         where: { album_id: { [Op.in]: albumIds } },
//         include: [
//           {
//             model: User,
//             as: "user",
//             attributes: ["username", "avatar"]
//           }
//         ]
//       }),

//       Comment.findAll({
//         where: {
//           album_id: { [Op.in]: albumIds },
//           parent_id: null
//         },
//         include: [
//           {
//             model: User,
//            as: "user",
//             attributes: ["username", "avatar"]
//           }
//         ]
//       }),

//       SavedAlbum.findAll({
//         where: {
//           user_id: req.user.id,
//           album_id: { [Op.in]: albumIds }
//         }
//       })
//     ]);

//     // 5. GROUP DATA
//     const reviewsByAlbum = {};
//     const commentsByAlbum = {};

//     allReviews.forEach((r) => {
//       if (!reviewsByAlbum[r.album_id]) reviewsByAlbum[r.album_id] = [];
//       reviewsByAlbum[r.album_id].push(r);
//     });

//     allComments.forEach((c) => {
//       if (!commentsByAlbum[c.album_id]) commentsByAlbum[c.album_id] = [];
//       commentsByAlbum[c.album_id].push(c);
//     });

//     const savedSet = new Set(savedAlbums.map((s) => s.album_id));

//     // 6. BUILD RESPONSE
//     const albums = upsertedAlbums.map((album) => {
//       const reviews = (reviewsByAlbum[album.id] || []).map((r) => ({
//         id: r.id,
//         username: r.User?.username,
//         avatar: r.User?.avatar,
//         rating: parseFloat(r.rating || 0),
//         review: r.review_text || "",
//         createdAt: r.createdAt
//       }));

//       const comments = (commentsByAlbum[album.id] || []).map((c) => ({
//         id: c.id,
//         username: c.User?.username,
//         avatar: c.User?.avatar,
//         text: c.text,
//         createdAt: c.createdAt
//       }));

//       const avgRating =
//         reviews.length > 0
//           ? (
//               reviews.reduce((sum, r) => sum + r.rating, 0) /
//               reviews.length
//             ).toFixed(1)
//           : 0;

//       return {
//         id: album.id,
//         name: album.name,
//         artist: album.artist,
//         cover: album.cover,

//         averageRating: parseFloat(avgRating),
//         totalReviews: reviews.length,

//         reviews,
//         comments,

//         isSaved: savedSet.has(album.id)
//       };
//     });

//     // 7. APPLY PLAN LIMIT
//     const final =
//       limit === Infinity ? albums : albums.slice(0, limit);

//     return res.json({
//       success: true,
//       plan: membership,
//       total: final.length,
//       data: final
//     });

//   } catch (err) {
//     console.log("❌ ERROR:", err.response?.data || err.message);

//     return res.status(500).json({
//       success: false,
//       error: err.message
//     });
//   }
// };

// module.exports = { getTrendingAlbums };
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

    const { User, Album, Review, Comment, SavedAlbum } =
      req.app.get("models");

    const membership = req.user?.membership || "club";
    const limit = PLAN_LIMITS[membership];

    // ─────────────────────────────
    // 1. FETCH TOP TRACKS
    // ─────────────────────────────
    const response = await axios.get(LASTFM_URL, {
      params: {
        method: "chart.getTopTracks",
        api_key: LASTFM_KEY,
        format: "json",
        limit: 30
      }
    });

    const tracks = response?.data?.tracks?.track || [];
    console.log("🎵 TRACKS:", tracks.length);

    // ─────────────────────────────
    // 2. SAFE ALBUM EXTRACTION
    // ─────────────────────────────
    const albumsRaw = tracks
      .map((t) => {
        const artist = t.artist?.name;
        const albumName = t.album?.["#text"] || t.name;

        if (!artist || !albumName) return null;

        return {
          albumName: albumName.trim(),
          artist: artist.trim()
        };
      })
      .filter(Boolean);

    console.log("💿 ALBUMS FOUND:", albumsRaw.length);

    if (!albumsRaw.length) {
      return res.json({
        success: true,
        message: "No albums found",
        data: []
      });
    }

    // ─────────────────────────────
    // 3. UPSERT INTO DB
    // ─────────────────────────────
    const upsertedAlbums = await Promise.all(
      albumsRaw.map(async (a) => {
        const [album] = await Album.findOrCreate({
          where: {
            name: a.albumName,
            artist: a.artist
          },
          defaults: {
            cover: ""
          }
        });

        return album;
      })
    );

    const albumIds = upsertedAlbums.map((a) => a.id);

    // ─────────────────────────────
    // 4. FETCH RELATED DATA
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
          user_id: req.user.id,
          album_id: { [Op.in]: albumIds }
        }
      })
    ]);

    // ─────────────────────────────
    // 5. GROUP DATA
    // ─────────────────────────────
    const reviewsByAlbum = {};
    const commentsByAlbum = {};

    allReviews.forEach((r) => {
      if (!reviewsByAlbum[r.album_id]) reviewsByAlbum[r.album_id] = [];
      reviewsByAlbum[r.album_id].push(r);
    });

    allComments.forEach((c) => {
      if (!commentsByAlbum[c.album_id]) commentsByAlbum[c.album_id] = [];
      commentsByAlbum[c.album_id].push(c);
    });

    const savedSet = new Set(savedAlbums.map((s) => s.album_id));

    // ─────────────────────────────
    // 6. BUILD FINAL RESPONSE
    // ─────────────────────────────
    const albums = upsertedAlbums.map((album) => {
      const reviews = (reviewsByAlbum[album.id] || []).map((r) => ({
        id: r.id,
        username: r.User?.username,
        avatar: r.User?.avatar,
        rating: parseFloat(r.rating || 0),
        review: r.review_text || "",
        createdAt: r.createdAt
      }));

      const comments = (commentsByAlbum[album.id] || []).map((c) => ({
        id: c.id,
        username: c.User?.username,
        avatar: c.User?.avatar,
        text: c.text,
        createdAt: c.createdAt
      }));

      const avgRating =
        reviews.length > 0
          ? (
              reviews.reduce((sum, r) => sum + r.rating, 0) /
              reviews.length
            ).toFixed(1)
          : 0;

      // 🎧 LAST.FM PLAY URL
      const playUrl = `https://www.last.fm/music/${encodeURIComponent(
        album.artist
      )}/${encodeURIComponent(album.name)}`;

      return {
        id: album.id,
        name: album.name,
        artist: album.artist,

        // 🖼️ image (from DB or empty)
        image: album.cover || "",

        // 🎧 play link
        albumPlayUrl: playUrl,

        averageRating: parseFloat(avgRating),
        totalReviews: reviews.length,

        reviews,
        comments,

        isSaved: savedSet.has(album.id)
      };
    });

    // ─────────────────────────────
    // 7. APPLY PLAN LIMIT
    // ─────────────────────────────
    const final =
      limit === Infinity ? albums : albums.slice(0, limit);

    return res.json({
      success: true,
      plan: membership,
      total: final.length,
      data: final
    });

  } catch (err) {
    console.log("❌ ERROR:", err.response?.data || err.message);

    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

module.exports = { getTrendingAlbums };