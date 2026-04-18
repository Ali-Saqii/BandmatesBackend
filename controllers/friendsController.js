const { Friend } = require("../models");
const { Op } = require("sequelize");

const sendFriendRequest = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiver_id } = req.body;

    // ❌ validate
    if (!receiver_id) {
      return res.status(400).json({
        success: false,
        message: "receiver_id is required"
      });
    }

    // ❌ prevent self request
    if (senderId === receiver_id) {
      return res.status(400).json({
        success: false,
        message: "You cannot send request to yourself"
      });
    }

    // 🔍 check if already exists (both directions)
    const existingRequest = await Friend.findOne({
      where: {
        [Op.or]: [
          { sender_id: senderId, receiver_id },
          { sender_id: receiver_id, receiver_id: senderId }
        ]
      }
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "Friend request already exists or user is already connected"
      });
    }

    // ✅ create request
    const request = await Friend.create({
      sender_id: senderId,
      receiver_id,
      status: "pending"
    });

    return res.status(201).json({
      success: true,
      message: "Friend request sent",
      data: request
    });

  } catch (error) {
    console.error("🔥 Send Friend Request Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

module.exports = { sendFriendRequest };