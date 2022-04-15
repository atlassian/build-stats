/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  testPathIgnorePatterns: [
    '/__fixtures__/'
  ],
  preset: 'ts-jest',
  testEnvironment: 'node',
};