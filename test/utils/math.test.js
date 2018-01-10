'use strict';
const test = require('ava');
const math = require('../../lib/utils/math');

test('math.getMinMax()', t => {
  t.deepEqual(math.getMinMax([1, 2, 3]), { min: 1, max: 3 });
  t.deepEqual(math.getMinMax([4, 2, 3]), { min: 2, max: 4 });
  t.deepEqual(math.getMinMax([]), { min: 0, max: 0 });
});

test('math.getMean()', t => {
  t.deepEqual(math.getMean([1, 2, 3]), 2);
  t.deepEqual(math.getMean([6, 4, 5]), 5);
  t.deepEqual(math.getMean([1, 2]), 1.5);
});

test('math.getPercentileMean()', t => {
  t.deepEqual(math.getPercentileMean([1, 2, 3], 75), 1.5);
  t.deepEqual(math.getPercentileMean([1, 2, 3, 4], 75), 2);
});
