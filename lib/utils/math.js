'use strict';

function getMinMax(nums) {
  let min = Math.min(...nums) || 0;
  let max = Math.max(...nums) || min;
  return { min, max };
}

function getMean(nums) {
  return nums.reduce((total, num) => total + num, 0) / nums.length;
}

function getPercentileMean(nums, per) {
  let index = Math.floor((per / 100) * nums.length);
  return getMean(nums.sort().slice(0, index));
}

module.exports = {
  getMinMax,
  getMean,
  getPercentileMean,
};
