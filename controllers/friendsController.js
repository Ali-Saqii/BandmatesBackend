const { Friend } = require("../models");
const { Op } = require("sequelize");

const sendFriendRequest = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiver_id } = req.body;

    if (!receiver_id) {
      return res.status(400).json({
        success: false,
        message: "receiver_id is required"
      });
    }

    if (senderId === receiver_id) {
      return res.status(400).json({
        success: false,
        message: "You cannot send request to yourself"
      });
    }
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
    const request = await Friend.create({
      sender_id: senderId,
      receiver_id,
      status: "pending"
    });

    return res.status(201).json({
      success: true,
      message: "Friend request sent",
    });

  } catch (error) {
    console.error("🔥 Send Friend Request Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Accecpt friend request 

const acceptFriendRequest = async (req, res) => {
  try {
    const userId = req.user.id; // receiver
    const { requestId } = req.params;

    const request = await Friend.findOne({
      where: {
        sender_id: requestId,
        receiver_id: userId,
        status: "pending"
      }
    });
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Friend request not found or already handled"
      });
    }

    // ✅ accept
    request.status = "accepted";
    await request.save();

    return res.status(200).json({
      success: true,
      message: "Friend request accepted"
    });

  } catch (error) {
    console.error("🔥 Accept Request Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// reject friend request
const rejectFriendRequest = async (req, res) => {
  try {
    const userId = req.user.id; // receiver
    const { requestId } = req.params;

    const request = await Friend.findOne({
      where: {
        id: requestId,
        receiver_id: userId,
        status: "pending"
      }
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Friend request not found or already handled"
      });
    }

    // ❌ reject
    request.status = "rejected";
    await request.save();

    return res.status(200).json({
      success: true,
      message: "Friend request rejected"
    });

  } catch (error) {
    console.error("🔥 Reject Request Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


module.exports = { 
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest
 };