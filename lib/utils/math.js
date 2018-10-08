'use strict';
const sortBy = require('lodash.sortby');

function getMinMax(nums) {
  let min = nums.length ? Math.min(...nums) : 0;
  let max = nums.length ? Math.max(...nums) : 0;
  return { min, max };
}

function getMean(nums) {
  return nums.reduce((total, num) => total + num, 0) / nums.length;
}

function getPercentileMean(nums, per) {
  let index = Math.floor((per / 100) * nums.length);
  // in case there are only one build in day
  index = Math.max(1, index);
  return getMean(sortBy(nums).slice(0, index));
}

module.exports = {
  getMinMax,
  getMean,
  getPercentileMean,
};
