'use strict';
module.exports = (sequelize, DataTypes) => {
  var User = sequelize.define('User', {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: { message: 'Must be a valid email.' }
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'member'
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {});
  User.associate = function(models) {
    // associations can be defined here
    User.hasOne(models.Verification, {
      foreignKey: 'user_id'
    });
  };

  User.prototype.isAdmin = function() {
    return this.role === 'admin';
  }

  User.prototype.isPremiumUser = function () {
    return this.role === 'premium';
  }

  return User;
};