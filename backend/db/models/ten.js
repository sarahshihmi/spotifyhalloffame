'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Ten extends Model {
    static associate(models) {
      // Define associations here
      Ten.belongsTo(models.User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
    }
  }
  Ten.init({
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    rank: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 1000,
      },
    },
    artist_name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    artist_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    song_name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    song_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'Ten',
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'rank'], // User cannot have multiple entries with the same rank
      },
      {
        unique: true,
        fields: ['user_id', 'song_id'], // User cannot have multiple entries with the same song
      },
    ],
  });
  return Ten;
};