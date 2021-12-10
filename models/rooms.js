'use strict';
module.exports = (sequelize, DataTypes) => {
  const rooms = sequelize.define('rooms', {
    id: DataTypes.INTEGER,
    USerId: DataTypes.INTEGER,
    UserId2: DataTypes.INTEGER
  }, {});
  rooms.associate = function(models) {
    // associations can be defined here
  };
  return rooms;
};