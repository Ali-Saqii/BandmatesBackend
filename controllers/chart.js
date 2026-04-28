const { User } = require("../models");
const sequelize = require("../config/db");

const getAlbumChart = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("Controller hit");

    const user = await User.findByPk(userId, { attributes: ["membership"] });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const membership = user.membership || "club";

    let limitClause = "";
    if (membership === "club")       limitClause = "LIMIT 5";
    else if (membership === "arena") limitClause = "LIMIT 25";
    // stadium → no limit

    const [albums] = await sequelize.query(`
      SELECT
        a.id         AS albumId,
        a.cover      AS image,
        a.name       AS albumName,
        a.artist     AS albumArtist,
        COALESCE(AVG(r.rating), 0)                             AS averageRating,
        COALESCE(COUNT(r.id), 0)                               AS totalRatings,
        SUM(CASE WHEN r.rating = 5 THEN 1 ELSE 0 END)         AS fiveStar,
        SUM(CASE WHEN r.rating = 4 THEN 1 ELSE 0 END)         AS fourStar,
        SUM(CASE WHEN r.rating = 3 THEN 1 ELSE 0 END)         AS threeStar,
        SUM(CASE WHEN r.rating = 2 THEN 1 ELSE 0 END)         AS twoStar,
        SUM(CASE WHEN r.rating = 1 THEN 1 ELSE 0 END)         AS oneStar
      FROM Albums a
      LEFT JOIN Reviews r ON r.album_id = a.id
      GROUP BY a.id, a.cover, a.name, a.artist
      ORDER BY averageRating DESC
      ${limitClause}
    `);

    const result = albums.map((a) => ({
      albumId:       a.albumId,
      image:         a.image,
      albumName:     a.albumName,
      albumArtist:   a.albumArtist,
      averageRating: parseFloat(a.averageRating || 0).toFixed(1),
      ratings: {
        fiveStar:  parseInt(a.fiveStar)  || 0,
        fourStar:  parseInt(a.fourStar)  || 0,
        threeStar: parseInt(a.threeStar) || 0,
        twoStar:   parseInt(a.twoStar)   || 0,
        oneStar:   parseInt(a.oneStar)   || 0,
      },
    }));

    console.log("Result count:", result.length);

    return res.status(200).json({
      success: true,
      message: "Successfully fetched",
      count:   result.length,
      data:    result,
    });

  } catch (error) {
    console.error("🔥 getAlbumsByMembership error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = { getAlbumChart };