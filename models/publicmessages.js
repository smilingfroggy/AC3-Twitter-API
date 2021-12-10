'use strict';
module.exports = (sequelize, DataTypes) => {
  const PublicMessage = sequelize.define('PublicMessage', {
    id: DataTypes.INTEGER,
    userId: DataTypes.INTEGER,
    content: DataTypes.STRING
  }, {});
  PublicMessage.associate = function (models) {
    // associations can be defined here
    PublicMessage.belongsTo(models.User)
  };
  return PublicMessage;
};