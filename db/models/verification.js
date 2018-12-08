'use strict';
module.exports = (sequelize, DataTypes) => {
  var Verification = sequelize.define('Verification', {
    hash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {});
  Verification.associate = function(models) {
    // associations can be defined here
    Verification.belongsTo(models.User, {
      foreignKey: 'user_id'
    });
  };
  return Verification;
};