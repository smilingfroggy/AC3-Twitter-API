'use strict';
module.exports = (sequelize, DataTypes) => {
  const publicMessages = sequelize.define('publicMessages', {
    id: DataTypes.INTEGER,
    userId: DataTypes.INTEGER,
    content: DataTypes.STRING
  }, {});
  publicMessages.associate = function (models) {
    // associations can be defined here
    publicMessages.belongsTo(models.User)
  };
  return publicMessages;
};