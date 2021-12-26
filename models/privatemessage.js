'use strict';
module.exports = (sequelize, DataTypes) => {
  const PrivateMessage = sequelize.define('PrivateMessage', {
    UserId: DataTypes.INTEGER,
    receiverId: DataTypes.INTEGER,
    content: DataTypes.STRING,
    RoomId: DataTypes.INTEGER
  }, {});
  PrivateMessage.associate = function (models) {
    // associations can be defined here
    PrivateMessage.belongsTo(models.Room)
    PrivateMessage.belongsTo(models.User)
  };
  return PrivateMessage;
};