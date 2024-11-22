'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      spotify_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true, 
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true, 
      },
      access_token: {
        type: Sequelize.TEXT,
        allowNull: false, // need for API requests
      },
      refresh_token: {
        type: Sequelize.TEXT,
        allowNull: false, // need for token refresh
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  },
};
