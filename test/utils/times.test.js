'use strict';
const test = require('ava');
const times = require('../../lib/utils/times');

const NOW = new Date();
const ONE_DAY_AGO = new Date(NOW - times.daysToMs(1));
const ONE_YEAR_AGO = new Date(NOW - times.daysToMs(365));

test('times.daysToMs()', t => {
  t.is(times.daysToMs(1), 86400000);
  t.is(times.daysToMs(2), 86400000 * 2);
});

test('times.withinDays()', t => {
  t.is(times.withinDays(NOW, ONE_YEAR_AGO, 2), false);
  t.is(times.withinDays(NOW, ONE_DAY_AGO, 2), true);
  t.is(times.withinDays(NOW, NOW, 2), true);
});

test('times.withinLastDays()', t => {
  t.is(times.withinLastDays(NOW, 2), true);
  t.is(times.withinLastDays(ONE_DAY_AGO, 2), true);
  t.is(times.withinLastDays(ONE_YEAR_AGO, 2), false);
});
