'use strict';
module.exports = (sequelize, DataTypes) => {
  const PrivateMessage = sequelize.define('PrivateMessage', {
    senderId: DataTypes.INTEGER,
    receiverId: DataTypes.INTEGER,
    RoomId: DataTypes.INTEGER
  }, {});
  PrivateMessage.associate = function (models) {
    // associations can be defined here
    PrivateMessage.belongsTo(models.Room)
  };
  return PrivateMessage;
};