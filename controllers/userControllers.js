const { User, SavedAlbum, Album, Friend } = require("../models");
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

// get users
const getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { rows: users, count: totalUsers } = await User.findAndCountAll({
      attributes: ["id", "username","displayName", "avatar", "description"],
      limit,
      offset,
      order: [["createdAt", "DESC"]]
    });

    const result = await Promise.all(
      users.map(async (user) => {

        const [savedAlbumsCount, friendsCount] = await Promise.all([
          SavedAlbum.count({ where: { user_id: user.id } }),

          Friend.count({
            where: {
              status: "accepted",
              [Op.or]: [
                { sender_id: user.id },
                { receiver_id: user.id }
              ]
            }
          })
        ]);
        const relation = await Friend.findOne({
          where: {
            [Op.or]: [
              { sender_id: currentUserId, receiver_id: user.id },
              { sender_id: user.id, receiver_id: currentUserId }
            ]
          }
        });

        let isRequested = false;
        let aretheyRequested = false;
        let isFriend = false;

        if (relation) {
          if (relation.status === "accepted") {
            isFriend = true;
          } else if (relation.status === "pending") {
            if (relation.sender_id === currentUserId) {
              isRequested = true;
            } else {
              aretheyRequested = true;
            }
          }
        }

        return {
          id: user.id,
          image: user.avatar || "",
          fullName: user.username,
          userName: user.displayName || "",
          Bio: user.description || "",

          bandmates: friendsCount,
          collections: savedAlbumsCount,

          isRequested,
          aretheyRequested,
          isFriend
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: result,

      pagination: {
        totalItems: totalUsers,
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        perPage: limit
      }
    });

  } catch (error) {
    console.error("🔥 Get All Users Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// get user's bandmates

const getUserBandmates = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.id;

    // ✅ pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const offset = (page - 1) * limit;

    // ✅ ONLY target user's accepted friends
    const { rows: friendships, count } = await Friend.findAndCountAll({
      where: {
        status: "accepted",
        [Op.or]: [
          { sender_id: targetUserId },
          { receiver_id: targetUserId }
        ]
      },
      limit,
      offset
    });

    //  extract ONLY friend IDs (not all users)
    const friendIds = friendships.map(f =>
      f.sender_id === targetUserId ? f.receiver_id : f.sender_id
    );

    // if no friends
    if (friendIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: {
          totalItems: 0,
          currentPage: page,
          totalPages: 0,
          perPage: limit
        }
      });
    }

    // ✅ fetch ONLY those users
    const users = await User.findAll({
      where: { id: friendIds },
      attributes: ["id", "username", "displayName","avatar", "description"]
    });

    // map for quick lookup
    const userMap = {};
    users.forEach(u => userMap[u.id] = u);

    const result = await Promise.all(friendIds.map(async (id) => {
      const user = userMap[id];
      if (!user) return null;

      // counts
      const [savedAlbumsCount, friendsCount] = await Promise.all([
        SavedAlbum.count({ where: { user_id: id } }),

        Friend.count({
          where: {
            status: "accepted",
            [Op.or]: [
              { sender_id: id },
              { receiver_id: id }
            ]
          }
        })
      ]);

      // relation with CURRENT user
      const relation = await Friend.findOne({
        where: {
          [Op.or]: [
            { sender_id: currentUserId, receiver_id: id },
            { sender_id: id, receiver_id: currentUserId }
          ]
        }
      });

      let isRequested = false;
      let aretheyRequested = false;
      let isFriend = false;

      if (relation) {
        if (relation.status === "accepted") isFriend = true;
        else if (relation.status === "pending") {
          if (relation.sender_id === currentUserId) isRequested = true;
          else aretheyRequested = true;
        }
      }

      return {
        id: user.id,
        image: user.avatar || "",
        fullName: user.username,
        userName: user.displayName || "",
        Bio: user.description || "",

        bandmates: friendsCount,
        collections: savedAlbumsCount,

        isRequested,
        aretheyRequested,
        isFriend
      };
    }));

    return res.status(200).json({
      success: true,
      data: result.filter(Boolean),
      pagination: {
        totalItems: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        perPage: limit
      }
    });

  } catch (error) {
    console.error("🔥 Get Targeted Bandmates Error:", error);

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
    updateSavedAlbumsVisibility,
    getAllUsers,
    getUserBandmates 
}