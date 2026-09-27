import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeTag, num, outcomeOf, str, warKey } from "./war-archive-pure";

test("normalizeTag adds a leading # and uppercases", () => {
  assert.equal(normalizeTag("2q0q82c9r"), "#2Q0Q82C9R");
  assert.equal(normalizeTag("#2Q0Q82C9R"), "#2Q0Q82C9R");
  assert.equal(normalizeTag("  2q0 q82c9r "), "#2Q0Q82C9R");
});

test("str only accepts real strings", () => {
  assert.equal(str("hello"), "hello");
  assert.equal(str(123), "");
  assert.equal(str(null), "");
  assert.equal(str(undefined), "");
});

test("num coerces to a finite number, else 0", () => {
  assert.equal(num("42"), 42);
  assert.equal(num(42), 42);
  assert.equal(num("not a number"), 0);
  assert.equal(num(NaN), 0);
  assert.equal(num(undefined), 0);
});

test("warKey combines both tags and the end time deterministically", () => {
  assert.equal(
    warKey("#ABC", "#DEF", "20260101T000000.000Z"),
    "#ABC__#DEF__20260101T000000.000Z",
  );
  // Order matters — a clan's own war and its mirror for the opponent must
  // produce different keys, not collide.
  assert.notEqual(
    warKey("#ABC", "#DEF", "20260101T000000.000Z"),
    warKey("#DEF", "#ABC", "20260101T000000.000Z"),
  );
});

test("outcomeOf trusts an explicit result field first", () => {
  assert.equal(outcomeOf({ result: "win" }), "win");
  assert.equal(outcomeOf({ result: "WON" }), "win");
  assert.equal(outcomeOf({ result: "lost" }), "lose");
  assert.equal(outcomeOf({ result: "tied" }), "tie");
});

test("outcomeOf falls back to comparing stars", () => {
  const war = {
    clan: { stars: 30, destructionPercentage: 80 },
    opponent: { stars: 28, destructionPercentage: 90 },
  };
  assert.equal(outcomeOf(war), "win");
});

test("outcomeOf falls back to destruction % when stars tie", () => {
  const war = {
    clan: { stars: 30, destructionPercentage: 91.5 },
    opponent: { stars: 30, destructionPercentage: 88.2 },
  };
  assert.equal(outcomeOf(war), "win");
});

test("outcomeOf is a true tie when stars and destruction both tie", () => {
  const war = {
    clan: { stars: 30, destructionPercentage: 90 },
    opponent: { stars: 30, destructionPercentage: 90 },
  };
  assert.equal(outcomeOf(war), "tie");
});

test("outcomeOf returns null when there isn't enough data to decide", () => {
  assert.equal(outcomeOf({}), null);
  assert.equal(outcomeOf({ clan: {} }), null);
});
