'use strict';
module.exports = (sequelize, DataTypes) => {
  const PublicMessage = sequelize.define('PublicMessage', {
    UserId: DataTypes.INTEGER,
    content: DataTypes.STRING
  }, {});
  PublicMessage.associate = function (models) {
    // associations can be defined here
    PublicMessage.belongsTo(models.User)
  };
  return PublicMessage;
};