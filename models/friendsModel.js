module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Friend', {
    id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    sender_id:    { type: DataTypes.UUID, allowNull: false },
    receiver_id:  { type: DataTypes.UUID, allowNull: false },
    status:       { type: DataTypes.ENUM('pending','accepted','rejected'), defaultValue: 'pending' },
  });
};