'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Hall extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Hall.belongsTo(models.User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
    }
  }
  Hall.init({
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    artist_name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    song_name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'Hall',
  });
  return Hall;
};