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
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    // Add a composite unique constraint on user_id and rank
    await queryInterface.addConstraint('Tens', {
      fields: ['user_id', 'rank'], // Columns for the unique constraint
      type: 'unique', // Type of constraint
      name: 'unique_user_rank', // Name of the constraint
    });
  },
  async down(queryInterface, Sequelize) {
    // Drop the Tens table
    await queryInterface.dropTable('Tens');
  },
};
