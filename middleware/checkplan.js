const PLAN_LIMITS = {
  club: 10,
  arena: 25,
  stadium: Infinity
};

const checkAlbumLimit = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user || !user.membership) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user"
      });
    }

    const limit = PLAN_LIMITS[user.membership];

    if (limit === undefined) {
      return res.status(403).json({
        success: false,
        message: "Invalid membership plan"
      });
    }

    // attach limit to request so controller can use it
    req.albumLimit = limit;

    next();

  } catch (err) {
    console.error("Plan middleware error:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

module.exports = checkAlbumLimit;