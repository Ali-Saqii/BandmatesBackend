module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Review', {
    id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id:     { type: DataTypes.UUID, allowNull: false },
    album_id:    { type: DataTypes.UUID, allowNull: false },
    rating:      { type: DataTypes.DECIMAL(2,1), allowNull: false },  // 1.0 to 5.0
    review_text: { type: DataTypes.TEXT },
  });
};