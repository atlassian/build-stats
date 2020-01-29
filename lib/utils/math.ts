export function getMinMax(nums) {
  let min = nums.length ? Math.min(...nums) : 0;
  let max = nums.length ? Math.max(...nums) : 0;
  return { min, max };
}

export function getMean(nums) {
  return nums.reduce((total, num) => total + num, 0) / nums.length;
}

export function getPercentileMean(nums, per) {
  let index = Math.floor((per / 100) * nums.length);
  // in case there are only one build in day
  index = Math.max(1, index);
  const sortedNums = nums.sort((a, b) => a - b);
  return getMean(sortedNums.slice(0, index));
}
