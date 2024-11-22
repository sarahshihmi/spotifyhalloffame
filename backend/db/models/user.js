'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // A user can have many Hall and Ten entries
      User.hasMany(models.Hall, { foreignKey: 'user_id', onDelete: 'CASCADE' });
      User.hasMany(models.Ten, { foreignKey: 'user_id', onDelete: 'CASCADE' });
    }
  }
  User.init({
    spotify_id: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    first_name: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    last_name: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    email: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    profile_image: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    spotify_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};