const { User, SavedAlbum, Friend } = require("../models");
const { Op } = require("sequelize");
const validation = require("../validations/authValidation");
const { Objectbject } = require("joi");
const bcrypt = require("bcryptjs")
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
                "email",
                "membership",
                "is_on_trial",
            ]
        })
        if (!user) {
            return res.status(404).json({
                success: false,
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
            success: true,
            message: "sucessfull fetch user",
             data: {
        id:               user.id,
        profileImage:     user.avatar        ?? "",
        fullName:         user.userName   ?? "",
        userName:         user.displayName      ?? "",
        Bio:              user.description   ?? "",
        waiting:          totalUsers,
        totalBandmates:   friendsCount,
        toralSavedAlbums: savedAlbumsCount,
        email:            user.email         ?? "",
        subscriptionPlan: user.membership    ?? "club",
        isOnTrial:        user.is_on_trial   ?? false,
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
                const avatar = req.file ? `uploads/avatars/${req.file.filename}` : undefined;

        const hasUpdates = Object.keys(value).some((key) => {
            const val = value[key];
            return val != undefined && val !== "";
        }) || avatar !== undefined ;

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
     user.avatar = avatar; 

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
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
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
// update 
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match"
      });
    }
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Old password is incorrect"
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });

  } catch (error) {
    console.error("🔥 Change Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
// hidden savedAlbums

const updateSavedAlbumsVisibility = async (req, res) => {
  try {
    const userId = req.user.id;
    const { isPrivate } = req.body;

    // ❌ validation
    if (typeof isPrivate !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isPrivate must be true or false"
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    user.savedAlbumsVisibility = isPrivate;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Privacy updated successfully",
      isPrivate: user.isPrivate
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


module.exports = {
    getUserProFile,
    updateUser,
    deleteUser,
    changePassword,
    updateSavedAlbumsVisibility 

}