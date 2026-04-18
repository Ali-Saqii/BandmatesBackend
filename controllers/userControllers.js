const { User, SavedAlbum, Friend } = require("../models");
const { Op } = require("sequelize");
const validation = require("../validations/authValidation");
const { object } = require("joi");

const getUserProFile = async (req, res) => {
    try{
        const userId = req.user.id;
        if(!userId){
            return res.status(400).json({
                sucess: false,
                message: "in valid token"
            })
        }
        const user = await User.findByPk(userId,{
            attributes: [
                "id",
                "username",
                "displayName",
                "avatar",
                "description",
                "email"
            ]
        })
        if (!user) {
            return res.status(404).json({
                sucess: falsem,
                message: "user not found"
            })
        }
        const [savedAlbumsCount, friendsCount, totalUsers] = await Promise.all([
            SavedAlbum.count({where: {user_Id : userId}}),
            Friend.count({
        where: {
          [Op.or]: [
            { sender_id: userId },
            { receiver_id: userId }
          ],
          status: "accepted"
        }
      }),
      User.count()
        ])

        return res.status(200).json({
            sucess: true,
            message: "sucessfull fetch user",
            data: {
        userId: user.id,      
        userProfileImage: user.avatar,
        userName: user.username,
        userDisplayName: user.displayName,
        email: user.email,
        bio: user.description,
        noOfFriends: friendsCount,
        numberOfSavedAlbums: savedAlbumsCount,
        totalUsers
      }
        })
    } catch(error) {
        console.error("internal server error: ",error)
        return res.status(500).json({
            sucess: false,
            message: "internal server error"
        })
    }
}
// update user

const updateUser = async (req, res) => {
    try{
        const { error, value } = validation.updateUserSchema.validate(req.body);
        if(error) {
            return res.status(400).json({
                sucess: false,
                message: `${error.message}`
            })
        }

        const user = await User.findByPk(req.user.id)
        if (!user) {
            return res.status(404).json({
                sucess: false,
                message: "user not found"
            })
        }
        const hasUpdates = object.keys(value).some((key) => {
            const val = value[key];
            return val != undefined && val !== "";
        });

        if (!hasUpdates){
            return res.status(200).json({
               success: true,
               message: "No changes made",
             })
        }
          if (value.username !== undefined && value.username !== "")
      user.username = value.username;

    if (value.displayName !== undefined && value.displayName !== "")
      user.displayName = value.displayName;

    if (value.avatar !== undefined)
      user.avatar = value.avatar || null;

    if (value.description !== undefined)
      user.description = value.description;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully"
    });
    }catch(error){
           console.error("internal server error: ",error)
        return res.status(500).json({
            sucess: false,
            message: "internal server error"
        })
    }
}
const deleteUser = async (req, res) => {
  try {
    const userId = req.user.id;

    // 👤 check user exists
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // 🗑️ delete user
    await user.destroy();

    return res.status(200).json({
      success: true,
      message: "User deleted successfully"
    });

  } catch (error) {
    console.error("🔥 Delete User Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

module.exports = {
    getUserProFile,
    updateUser,
    deleteUser
}