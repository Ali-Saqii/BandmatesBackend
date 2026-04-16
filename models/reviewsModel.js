
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Review = sequelize.define('Review', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id:     { type: DataTypes.UUID, allowNull: false },
  album_id:    { type: DataTypes.UUID, allowNull: false },
  rating:      { type: DataTypes.DECIMAL(2,1), allowNull: false },
  review_text: { type: DataTypes.TEXT },
});

module.exports = Review;