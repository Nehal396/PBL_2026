import test from "node:test";
import assert from "node:assert/strict";
import { getRentalDays, parseDateOnly } from "./rentalDates.js";

test("parses valid UTC date-only values", () => {
  assert.equal(parseDateOnly("2026-02-28").toISOString(), "2026-02-28T00:00:00.000Z");
  assert.equal(parseDateOnly("2026-02-30"), null);
});

test("counts rental days with an exclusive return date", () => {
  assert.equal(getRentalDays(parseDateOnly("2026-04-10"), parseDateOnly("2026-04-13")), 3);
  assert.equal(getRentalDays(parseDateOnly("2026-04-10"), parseDateOnly("2026-04-10")), null);
});
