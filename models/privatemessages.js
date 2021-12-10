'use strict';
module.exports = (sequelize, DataTypes) => {
  const privateMessages = sequelize.define('privateMessages', {
    id: DataTypes.INTEGER,
    SenderId: DataTypes.INTEGER,
    RecieverId: DataTypes.INTEGER,
    RoomId: DataTypes.INTEGER
  }, {});
  privateMessages.associate = function (models) {
    // associations can be defined here
    privateMessages.belongsTo(models.User)

  };
  return privateMessages;
};