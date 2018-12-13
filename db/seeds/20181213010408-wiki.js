'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkInsert('Person', [{
        name: 'John Doe',
        isBetaMember: false
      }], {});
    */
    return queryInterface.bulkInsert('Wikis', [{
      title: 'That is totally sweet.',
      body: 'Wicked awesome',
      private: false,
      updated: false,
      userId: 1,
      createdAt: '2013-11-22 07:26:53',
      updatedAt: '2013-11-22 07:26:53'
    }])
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkDelete('Person', null, {});
    */
   return queryInterface.bulkDelete('Wikis', null, {});
  }
};
