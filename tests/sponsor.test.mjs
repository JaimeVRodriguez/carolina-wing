import { test } from "node:test";
import assert from "node:assert/strict";
import {
  TIERS,
  FOUNDING_PARTNER,
  getTier,
  formatUSD,
  installmentSchedule,
  validateSponsor,
  validateCard,
} from "../js/sponsor.js";

test("tiers match the booklet prices, highest first", () => {
  assert.deepEqual(
    TIERS.map((t) => [t.id, t.price]),
    [
      ["presenting", 7500],
      ["championship", 5000],
      ["diamond", 3000],
      ["platinum", 1500],
      ["gold", 1000],
      ["silver", 500],
      ["community", 250],
    ],
  );
});

test("every tier lists all seven benefits", () => {
  for (const t of TIERS) assert.equal(Object.keys(t.benefits).length, 7, t.id);
});

test("getTier finds tiers and the founding partner package", () => {
  assert.equal(getTier("gold").price, 1000);
  assert.equal(getTier("founding"), FOUNDING_PARTNER);
  assert.equal(getTier("nope"), undefined);
});

test("formatUSD formats whole dollars", () => {
  assert.equal(formatUSD(7500), "$7,500");
  assert.equal(formatUSD(250), "$250");
});

test("founding partner is $20,000 in four $5,000 installments", () => {
  assert.equal(FOUNDING_PARTNER.price, 20000);
  assert.deepEqual(installmentSchedule(FOUNDING_PARTNER), [5000, 5000, 5000, 5000]);
});

test("regular tiers are paid in one payment", () => {
  assert.deepEqual(installmentSchedule(getTier("silver")), [500]);
});

const goodSponsor = {
  tierId: "diamond",
  business: "Rowan Hot Sauce Co.",
  contact: "Pat Smith",
  email: "pat@example.com",
  phone: "910-555-0100",
};

test("validateSponsor accepts a complete sponsor", () => {
  assert.deepEqual(validateSponsor(goodSponsor), {});
});

test("validateSponsor flags each bad field", () => {
  const errors = validateSponsor({ tierId: "x", business: " ", contact: "", email: "nope", phone: "12" });
  assert.deepEqual(Object.keys(errors).sort(), ["business", "contact", "email", "phone", "tierId"]);
});

test("validateSponsor allows a blank phone", () => {
  assert.deepEqual(validateSponsor({ ...goodSponsor, phone: "" }), {});
});

const now = new Date(2026, 10, 11);

test("validateCard accepts a Luhn-valid card with spaces", () => {
  const errors = validateCard({ number: "4242 4242 4242 4242", expiry: "12/30", cvc: "123", name: "Pat Smith" }, now);
  assert.deepEqual(errors, {});
});

test("validateCard rejects bad number, expired date, short cvc, missing name", () => {
  const errors = validateCard({ number: "4242 4242 4242 4241", expiry: "01/20", cvc: "1", name: "" }, now);
  assert.deepEqual(Object.keys(errors).sort(), ["cvc", "expiry", "name", "number"]);
});

test("validateCard rejects malformed expiry", () => {
  assert.ok(validateCard({ number: "4242424242424242", expiry: "13/30", cvc: "123", name: "A" }, now).expiry);
  assert.ok(validateCard({ number: "4242424242424242", expiry: "1230", cvc: "123", name: "A" }, now).expiry);
});
