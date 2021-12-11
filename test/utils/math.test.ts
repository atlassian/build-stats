import * as math from "../../lib/utils/math";

test("math.getMinMax()", () => {
  expect(math.getMinMax([1, 2, 3])).toEqual({ min: 1, max: 3 });
  expect(math.getMinMax([4, 2, 3])).toEqual({ min: 2, max: 4 });
  expect(math.getMinMax([])).toEqual({ min: 0, max: 0 });
});

test("math.getMean()", () => {
  expect(math.getMean([1, 2, 3])).toBe(2);
  expect(math.getMean([6, 4, 5])).toBe(5);
  expect(math.getMean([1, 2])).toBe(1.5);
});

test("math.getPercentileMean()", () => {
  expect(math.getPercentileMean([1, 2, 3], 75)).toBe(1.5);
  expect(math.getPercentileMean([1, 2, 3, 4], 75)).toBe(2);
});
