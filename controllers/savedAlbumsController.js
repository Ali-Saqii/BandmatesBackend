const { User, SavedAlbum, Album, Review, Comment } = require("../models")

const savedAlbum = async (req, res) => {
    try{
        const userId = req.user.id;
        const { album_id, collection_id } = req.body

        if (!album_id || !collection_id) {
            return res.status(400).json({
                success: false,
                message: "album and collection required!!!"
            })
        }

        // check duplicate 
        const existing = await SavedAlbums.findOne({
            where:{
                user_id: userId,
                album_id,
                collection_id
            }
        })
        if (existing) {
            return res.status(409).json({
                sucess: false,
                message: "Album already saved in this collection"
            })
        }
        const saved = await SavedAlbums.create({
            user_id: userId,
            album_id,
            collection_id
        })
        return res.status(201).json({
            success: true,
            message: "Album sucessfully saved✅"
        })
    }catch(error){
        console.error("Enternal server error:",error)
        return res.status(500).json({
            success: false,
            message: "Internal server error❗️"
        })
    }
}

const removeAlbum = async (req, res) => {
    try{
        const userId = req.user.id;
        const { album_id, collection_id } = req.params;

        if (!album_id || !collection_id) {
            return res.status(400).json({
                success: false,
                message: "album and collection required!!!"
            })
        }
        const record  = await SavedAlbums.findOne({
            user_id: userId,
            album_id,
            collection_id

        })

        if (!record) {
            return res.status(404).json({
                sucess: false,
                message: "saved album not found to delete"
            })
        }
        await record.destroy();

        return res.status(200).json({
            success: true,
            message: "Album removed from collection"
        });


    }catch(error){
         console.error("Enternal server error:",error)
        return res.status(500).json({
            success: false,
            message: "Internal server error❗️"
        })
    }
}
// Get saved albums

const getUserSavedAlbums = async (req, res) => {
  try {
    const { User, Album, Review, Comment, SavedAlbum } = req.app.get("models");

    const userId = req.params.id;

    // pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(20, parseInt(req.query.limit) || 10);
    const offset = (page - 1) * limit;

    // check user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // ─────────────────────────────
    // 1. GET SAVED ALBUMS
    // ─────────────────────────────
    const { rows, count } = await SavedAlbum.findAndCountAll({
      where: { user_id: userId },
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Album,
          as: "album",
          attributes: [
            "id",
            "name",
            "artist",
            "cover" // ✅ FIXED (removed invalid fields)
          ],
          include: [
            {
              model: Review,
              as: "reviews",
              include: [
                {
                  model: User,
                  as: "user",
                  attributes: ["username", "avatar"]
                }
              ]
            },
            {
              model: Comment,
              as: "comments",
              where: { parent_id: null },
              required: false,
              include: [
                {
                  model: User,
                  as: "user",
                  attributes: ["username", "avatar"]
                }
              ]
            }
          ]
        }
      ]
    });

    // ─────────────────────────────
    // 2. FORMAT RESPONSE
    // ─────────────────────────────
    const albums = rows.map((item) => {
      const album = item.album;

      const reviews = (album.reviews || []).map((r) => ({
        id: r.id,
        personImage: r.user?.avatar || "",
        personName: r.user?.username || "Anonymous",
        dateOfRating: r.createdAt,
        rating: parseFloat(r.rating || 0),
        reviewBody: r.review_text || ""
      }));

      const replies = (album.comments || []).map((c) => ({
        id: c.id,
        image: c.user?.avatar || "",
        name: c.user?.username || "Anonymous",
        disPlayName: c.user?.username || "",
        replieText: c.text,
        replieTime: c.createdAt
      }));

      const averageRating =
        reviews.length > 0
          ? parseFloat(
              (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
            )
          : 0;

      return {
        id: album.id,
        image: album.cover || "",
        albumName: album.name,
        albumArtistName: album.artist,

        // ✅ FIXED (no release_date column)
        releaseDate: album.createdAt || "",

        averageRating,
        totalRatingCount: reviews.length,
        reviews,
        replies,
        isSaved: true,

        // ✅ FIXED (no play_link column)
        albumPlayLink: `https://www.last.fm/music/${encodeURIComponent(
          album.artist
        )}/${encodeURIComponent(album.name)}`
      };
    });

    // ─────────────────────────────
    // 3. RESPONSE
    // ─────────────────────────────
    return res.json({
      success: true,
      plan: user.membership || "club",
      total: count,
      data: albums
    });

  } catch (error) {
    console.error("🔥 Get Saved Albums Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


module.exports = {
    savedAlbum,
    removeAlbum,
    getUserSavedAlbums
}