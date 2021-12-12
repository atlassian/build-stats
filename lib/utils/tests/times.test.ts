import * as times from "../times";

const NOW = Date.now();
const ONE_DAY_AGO = new Date(NOW - times.daysToMs(1));
const ONE_YEAR_AGO = new Date(NOW - times.daysToMs(365));

test("times.daysToMs()", () => {
  expect(times.daysToMs(1)).toBe(86400000);
  expect(times.daysToMs(2)).toBe(86400000 * 2);
});

test("times.withinDays()", () => {
  expect(times.withinDays(NOW, ONE_YEAR_AGO, 2)).toBe(false);
  expect(times.withinDays(NOW, ONE_DAY_AGO, 2)).toBe(true);
  expect(times.withinDays(NOW, NOW, 2)).toBe(true);
});

test("times.withinLastDays()", () => {
  expect(times.withinLastDays(NOW, 2)).toBe(true);
  expect(times.withinLastDays(ONE_DAY_AGO, 2)).toBe(true);
  expect(times.withinLastDays(ONE_YEAR_AGO, 2)).toBe(false);
});
