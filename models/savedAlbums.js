
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('CollectionAlbum', {
    collection_id: { type: DataTypes.UUID },
    album_id:      { type: DataTypes.UUID },
  });
};