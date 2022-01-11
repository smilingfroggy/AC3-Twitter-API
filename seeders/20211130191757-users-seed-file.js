'use strict';
const bcrypt = require('bcryptjs')
const faker = require('faker')

module.exports = {
  up: (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkInsert('People', [{
        name: 'John Doe',
        isBetaMember: false
      }], {});
    */
    return queryInterface.bulkInsert('Users', [
      {
        id: 1,
        email: 'root@example.com',
        account: 'root',
        name: 'root',
        password: bcrypt.hashSync('12345678', bcrypt.genSaltSync(10), null),
        role: 'admin',
        avatar: 'https://i.imgur.com/tdi3NGa.png',
        cover: 'https://via.placeholder.com/1200x400',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      ...Array.from({ length: 5 }).map((d, i) => ({
        id: (i + 1) * 10 + 1,
        email: `user${i + 1}@example.com`,
        password: bcrypt.hashSync('12345678', bcrypt.genSaltSync(10), null),
        name: faker.name.findName(),
        avatar: `https://i.pravatar.cc/300?u=user${i+1}`,
        account: `user${i + 1}`,
        cover: `https://picsum.photos/seed/user${i+1}/1200/400`,
        introduction: faker.lorem.text(),
        createdAt: new Date(),
        updatedAt: new Date()
      }))
    ], {})
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkDelete('People', null, {});
    */
    return queryInterface.bulkDelete('Users', null, {})
  }
};
