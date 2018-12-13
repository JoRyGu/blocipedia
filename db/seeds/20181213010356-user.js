'use strict';
const bcrypt = require('bcryptjs');

function encryptPassword(password) {
  return bcrypt.hashSync(password);
}

module.exports = {
  up: (queryInterface, Sequelize) => {
   return queryInterface.bulkInsert('Users', [{
     id: 1,
     firstname: 'John',
     lastname: 'Doe',
     email: 'fake1@fake.net',
     password: encryptPassword('bartsimpson'),
     role: 'member',
     active: true,
     createdAt: '2013-11-22 07:26:53',
     updatedAt: '2013-11-22 07:26:53'
   }, {
     id: 2,
     firstname: 'Jane',
     lastname: 'Doe',
     email: 'fake2@fake.net',
     password: encryptPassword('lisasimpson'),
     role: 'member',
     active: true,
     createdAt: '2013-11-22 07:26:53',
     updatedAt: '2013-11-22 07:26:53'
   }], {});
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkDelete('Person', null, {});
    */
   return queryInterface.bulkDelete('Users', null, {});
  }
};
