const sequelize = require('../config/db');

const User          = require('./userModel');
const Album         = require('./albumModel');
const Review        = require('./reviewsModel');
const Comment       = require('./commentsModel');
const Collection    = require('./colletionModel');
const Friend        = require('./friendsModel');
const Notification  = require('./notificationModel');
const SavedAlbum    = require('./savedAlbums');
const SearchHistory = require('./searchHistory');

User.hasMany(Review, {
  foreignKey: 'user_id',
  as: 'reviews',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
Review.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

User.hasMany(Comment, {
  foreignKey: 'user_id',
  as: 'comments',
  onDelete: 'CASCADE',
});
Comment.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

User.hasMany(Collection, {
  foreignKey: 'user_id',
  as: 'collections',
  onDelete: 'CASCADE',
});
Collection.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

User.hasMany(Friend, {
  foreignKey: 'sender_id',
  as: 'sentRequests',
  onDelete: 'CASCADE',
});
User.hasMany(Friend, {
  foreignKey: 'receiver_id',
  as: 'receivedRequests',
  onDelete: 'CASCADE',
});

Friend.belongsTo(User, {
  foreignKey: 'sender_id',
  as: 'sender',
});
Friend.belongsTo(User, {
  foreignKey: 'receiver_id',
  as: 'receiver',
});

User.hasMany(Notification, {
  foreignKey: 'user_id',
  as: 'notifications',
  onDelete: 'CASCADE',
});
Notification.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

User.hasMany(SavedAlbum, {
  foreignKey: 'user_id',
  as: 'savedAlbums',
  onDelete: 'CASCADE',
});
SavedAlbum.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

User.hasMany(SearchHistory, {
  foreignKey: 'user_id',
  as: 'searchHistory',
  onDelete: 'CASCADE',
});
SearchHistory.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});


Album.hasMany(Review, {
  foreignKey: 'album_id',
  as: 'reviews',
  onDelete: 'CASCADE',
});
Review.belongsTo(Album, {
  foreignKey: 'album_id',
  as: 'album',
});

Album.hasMany(Comment, {
  foreignKey: 'album_id',
  as: 'comments',
  onDelete: 'CASCADE',
});
Comment.belongsTo(Album, {
  foreignKey: 'album_id',
  as: 'album',
});

Album.hasMany(SavedAlbum, {
  foreignKey: 'album_id',
  as: 'savedByUsers',
  onDelete: 'CASCADE',
});
SavedAlbum.belongsTo(Album, {
  foreignKey: 'album_id',
  as: 'album',
});

Collection.hasMany(SavedAlbum, {
  foreignKey: 'collection_id',
  as: 'savedAlbums',
  onDelete: 'SET NULL',
});
SavedAlbum.belongsTo(Collection, {
  foreignKey: 'collection_id',
  as: 'collection',
});


Comment.hasMany(Comment, {
  foreignKey: 'parent_id',
  as: 'replies',
  onDelete: 'CASCADE',
});
Comment.belongsTo(Comment, {
  foreignKey: 'parent_id',
  as: 'parent',
});


module.exports = {
  sequelize,
  User,
  Album,
  Review,
  Comment,
  Collection,
  Friend,
  Notification,
  SavedAlbum,
  SearchHistory,
};