'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index.js` file will call this method automatically.
     */
    static associate(models) {
       // A User can have many Hall entries
       User.hasMany(models.Hall, {
        foreignKey: 'user_id', // Foreign key in the Hall table
        onDelete: 'CASCADE',  // Delete all Hall entries when a User is deleted
        hooks: true,
      });

      // A User can have many Ten entries
      User.hasMany(models.Ten, {
        foreignKey: 'user_id', // Foreign key in the Ten table
        onDelete: 'CASCADE',  // Delete all Ten entries when a User is deleted
        hooks: true,
      });
    }
  }
  User.init(
    {
      spotify_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      access_token: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      refresh_token: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'User',
    }
  );
  return User;
};
