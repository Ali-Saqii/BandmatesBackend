const sequelize = require('../config/db');

const User         = require('./userModel');
const Album        = require('./albumModel');
const Review       = require('./reviewsModel');
const comment      = require('./commentsModel');
const Collection   = require('./colletionModel');
const Friend       = require('./friendsModel');
const Notification = require('./notificationModel');
const SavedAlbum   = require('./savedAlbums');
const SearchHistory = require('./searchHistory');


// User → Reviews
User.hasMany(Review,       { foreignKey: 'user_id' });
Review.belongsTo(User,     { foreignKey: 'user_id' });

// User → Comments
User.hasMany(Comment,      { foreignKey: 'user_id' });
comment.belongsTo(User,    { foreignKey: 'user_id' });

// User → Collections
User.hasMany(Collection,   { foreignKey: 'user_id' });
Collection.belongsTo(User, { foreignKey: 'user_id' });

// User → Friends
User.hasMany(Friend,       { foreignKey: 'sender_id' });
User.hasMany(Friend,       { foreignKey: 'receiver_id' });

// User → Notifications
User.hasMany(Notification,     { foreignKey: 'user_id' });
Notification.belongsTo(User,   { foreignKey: 'user_id' });

// User → SavedAlbums
User.hasMany(SavedAlbum,       { foreignKey: 'user_id' });
SavedAlbum.belongsTo(User,     { foreignKey: 'user_id' });

// User → SearchHistory
User.hasMany(SearchHistory,    { foreignKey: 'user_id' });
SearchHistory.belongsTo(User,  { foreignKey: 'user_id' });

// Album → Reviews
Album.hasMany(Review,      { foreignKey: 'album_id' });
Review.belongsTo(Album,    { foreignKey: 'album_id' });

// Album → Comments
Album.hasMany(Comment,     { foreignKey: 'album_id' });
Comment.belongsTo(Album,   { foreignKey: 'album_id' });

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
  SearchHistory
};