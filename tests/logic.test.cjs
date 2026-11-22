const test = require('node:test');
const assert = require('node:assert/strict');
const compare = (a, op, b) => ({
  "<": a < b, "<=": a <= b, "=": a === b, ">=": a >= b, ">": a > b, "!=": a !== b
})[op] ?? false;
test('comparison operators', () => {
  assert.equal(compare(5, '<', 10), true);
  assert.equal(compare(5, '<=', 5), true);
  assert.equal(compare(5, '=', 5), true);
  assert.equal(compare(5, '>=', 5), true);
  assert.equal(compare(6, '>', 5), true);
  assert.equal(compare(5, '!=', 4), true);
  assert.equal(compare(5, 'unknown', 5), false);
});
test('threshold equality is intentional', () => assert.equal(compare(20, '>=', 20), true));
