'use strict';
module.exports = (sequelize, DataTypes) => {
  const Room = sequelize.define('Room', {
    USerId: DataTypes.INTEGER,
    UserId2: DataTypes.INTEGER
  }, {});
  Room.associate = function (models) {
    // associations can be defined here
    Room.hasMany(models.PrivateMessage)
  };
  return Room;
};