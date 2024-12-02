'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create the Tens table
    await queryInterface.createTable('Tens', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      rank: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      artist_name: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      artist_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      song_name: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      song_id: {
        type: Sequelize.STRING,
        allowNull: false,
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

    // Add composite unique constraints
    await queryInterface.addConstraint('Tens', {
      fields: ['user_id', 'rank'], // User cannot have multiple entries with the same rank
      type: 'unique',
      name: 'unique_user_rank',
    });

    await queryInterface.addConstraint('Tens', {
      fields: ['user_id', 'song_id'], // User cannot have multiple entries with the same song
      type: 'unique',
      name: 'unique_user_song_id',
    });
  },
  async down(queryInterface, Sequelize) {
    // Drop the Tens table
    await queryInterface.dropTable('Tens');
  },
};
