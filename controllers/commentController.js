const { Comment, User, SavedAlbum } = require("../models");
const { createCommentNotification } = require("../controllers/notificationController");

const postComment = async (req, res) => {
    try {
    const { album_id }          = req.params;
    const { text, parent_id }   = req.validatedBody;
    const user_id               = req.user.id;

    if (parent_id) {
        const parent = await Comment.findByPk(parent_id);
        if(!parent) {
            return res.status(404).json({
                sucess: false,
                message: 'Parent comment not found'
            })
        }
    }

    const comment = await Comment.create({
        user_id,
        album_id,
        text: text.trim(),
        parent_id: parent_id || null
    });

        const commenter = await User.findByPk(user_id, { attributes: ['username'] });

        const savedByUsers = await SavedAlbum.findAll({
            where: { album_id },
            attributes: ['user_Id']
        });

        const savedByUserIds = savedByUsers
            .map(s => s.user_Id)
            .filter(id => id !== user_id); 

        if (savedByUserIds.length > 0) {
            await createCommentNotification(
                savedByUserIds,
                user_id,
                commenter?.username || 'Someone',
                album_id  
            );
        }
     res.status(201).json({
      success: true,
      message: parent_id ? 'Reply posted successfully' : 'Comment posted successfully'
    });
    } catch(error) {
    console.error(error);
    res.status(500).json({ success: false, message: `${error.message}`});
  }
}

module.exports = { postComment }