const User = require("../models/userModel");
const { Op } = require("sequelize");


const PLANS = {
  club: {
    name: "Club",
    membership: "club",
    billing: null,
    trial_days: 0,
    features: ["Basic access", "Limited uploads", "Public profile"],
  },
  arena_monthly: {
    name: "Arena – Monthly",
    membership: "arena",
    billing: "monthly",
    duration_days: 30,
    trial_days: 14,
    features: ["Everything in Club", "HD streaming", "Custom themes"],
  },
  arena_annual: {
    name: "Arena – Annual",
    membership: "arena",
    billing: "annual",
    duration_days: 365,
    trial_days: 14,
    features: ["Everything in Arena Monthly", "2 months free"],
  },
  stadium_monthly: {
    name: "Stadium – Monthly",
    membership: "stadium",
    billing: "monthly",
    duration_days: 30,
    trial_days: 14,
    features: ["Everything in Arena", "Priority support", "Analytics dashboard"],
  },
  stadium_annual: {
    name: "Stadium – Annual",
    membership: "stadium",
    billing: "annual",
    duration_days: 365,
    trial_days: 14,
    features: ["Everything in Stadium Monthly", "2 months free"],
  },
};


const addDays = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
}

exports.getPlans = (req,res) => {
    return res.status(200).json({
        sucess: false,
        plans: PLANS,
    })
}

const selectPlan = async (req,res) => {
    try{
        const { plan } = req.body;
        const userId = req.user.id

        if(!plan || !PLANS[plan]) {
            return res.status(400).json({
                sucess: false,
                message: "Invalid Plan"
            })
        }

        if(plan === "club") {
            res.status(400).json({
                sucess: false,
                message: "club is free tier"
            })
        }
        const user = await User.findByPk(userId)
        if(!user) return res.status(404).json({sucess: false, message: "user not found"})

        const selectedPlan = PLANS[plan];
        const now = new Date();

        const hasUedTrial = user.trial_ends_at && new Date(user.trial_ends_at ) < now && !user.is_on_trial;

         let trialEndsAt = null;
         let subscriptionEndsAt = null;
         let isOnTrial = false;


         if (!hasUedTrial && user.membership === "club") {
            trialEndsAt = addDays(selectedPlan.trial_days);         // 14 days trial
            subscriptionEndsAt = addDays(selectedPlan.trial_days);  // after trial, they must "activate" or auto-downgrade
            isOnTrial = true;
         } else {
            subscriptionEndsAt = addDays(selectedPlan.duration_days);
            trialEndsAt = user.trial_ends_at; // keep old trial date for record
            isOnTrial = false;
         }

           await user.update({
      membership: selectedPlan.membership,
      subscription_plan: selectedPlan.billing,
      trial_ends_at: trialEndsAt,
      subscription_ends_at: subscriptionEndsAt,
      is_on_trial: isOnTrial,
    });

        return res.status(200).json({
      success: true,
      message: isOnTrial
        ? `${selectedPlan.name} activated! Your 14-day free trial has started.`
        : `${selectedPlan.name} activated successfully!`,
      data: {
        membership: user.membership,
        plan: selectedPlan.name,
        billing: selectedPlan.billing,
        is_on_trial: isOnTrial,
        trial_ends_at: trialEndsAt,
        subscription_ends_at: subscriptionEndsAt,
      },
    });

    } catch(error){
    console.error("selectPlan error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });

    }
}
// cance plan
exports.cancelPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.membership === "club") {
      return res.status(400).json({ success: false, message: "You are already on the free Club plan." });
    }

    // Downgrade immediately to Club
    await user.update({
      membership: "club",
      subscription_plan: null,
      trial_ends_at: null,
      subscription_ends_at: null,
      is_on_trial: false,
    });

    return res.status(200).json({
      success: true,
      message: "Subscription cancelled. You have been moved to the Club (free) plan.",
    });
  } catch (error) {
    console.error("cancelPlan error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
module.exports  = {
    selectPlan
}