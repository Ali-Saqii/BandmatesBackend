// middleware/checkPlan.js
const PLAN_LIMITS = {
  free:    { search: 5,  collections: 2  },
  starter: { search: 10, collections: 10 },
  premium: { search: Infinity, collections: Infinity }
};

const checkPlan = (feature) => async (req, res, next) => {
  const user = req.user;
  const limit = PLAN_LIMITS[user.membership][feature];
  // check usage vs limit
  if (usage >= limit) {
    return res.status(403).json({ 
      error: 'Upgrade your plan to access this feature' 
    });
  }
  next();
};