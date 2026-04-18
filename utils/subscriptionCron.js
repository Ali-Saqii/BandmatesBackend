// utils/subscriptionCron.js
const cron = require("node-cron");
const User = require("../models/User");
const { Op } = require("sequelize");

const startSubscriptionCron = () => {
  // Runs every day at midnight
  cron.schedule("0 0 * * *", async () => {
    console.log("[Cron] Checking for expired subscriptions...");
    try {
      const now = new Date();
      const expiredUsers = await User.findAll({
        where: {
          membership: { [Op.in]: ["arena", "stadium"] },
          subscription_ends_at: { [Op.lt]: now },
        },
      });

      if (expiredUsers.length > 0) {
        const ids = expiredUsers.map((u) => u.id);
        await User.update(
          { membership: "club", subscription_plan: null, subscription_ends_at: null, is_on_trial: false },
          { where: { id: { [Op.in]: ids } } }
        );
        console.log(`[Cron] Downgraded ${ids.length} user(s) to Club.`);
      } else {
        console.log("[Cron] No expired subscriptions.");
      }
    } catch (err) {
      console.error("[Cron] Error:", err.message);
    }
  });
};

module.exports = startSubscriptionCron;