/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  testPathIgnorePatterns: [
    '/__fixtures__/',
    '/dist/'
  ],
  preset: 'ts-jest',
  testEnvironment: 'node',
};