import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateInstallmentPlan,
  calculateCreditCardPlan,
  generateAmortizationSchedule,
  FINANCE_COMPANIES,
  CREDIT_CARD_BANKS,
  DOWN_PAYMENT_OPTIONS,
  INSTALLMENT_TERMS,
  MIN_INSTALLMENT_TOTAL,
} from "../app/installment.ts";

test("Constants and partners are properly configured", () => {
  assert.ok(Array.isArray(FINANCE_COMPANIES) && FINANCE_COMPANIES.length >= 4);
  assert.ok(Array.isArray(CREDIT_CARD_BANKS) && CREDIT_CARD_BANKS.length >= 8);
  assert.ok(DOWN_PAYMENT_OPTIONS.includes(0));
  assert.ok(DOWN_PAYMENT_OPTIONS.includes(50));
  assert.ok(INSTALLMENT_TERMS.includes(12));
  assert.equal(MIN_INSTALLMENT_TOTAL, 2_000_000);
});

test("Finance company calculation yields correct down payment and monthly payment", () => {
  const total = 30_000_000;
  const downPaymentPercent = 20; // 6,000,000
  const term = 12;
  const rate = 1.65;

  const result = calculateInstallmentPlan(total, downPaymentPercent, term, rate);
  assert.equal(result.downPaymentAmount, 6_000_000);
  assert.equal(result.financedAmount, 24_000_000);
  assert.ok(result.monthlyPayment > 0);
  assert.ok(result.dailyPayment > 0);
  assert.equal(result.mode, "finance_company");
  assert.equal(result.totalPayment, result.downPaymentAmount + result.monthlyPayment * term);
});

test("Credit card 0% calculation applies conversion fee correctly", () => {
  const total = 20_000_000;
  const downPaymentPercent = 0; // 0đ trả trước
  const term = 6;
  const conversionFeePercent = 2.0;

  const result = calculateCreditCardPlan(total, downPaymentPercent, term, conversionFeePercent);
  assert.equal(result.downPaymentAmount, 0);
  assert.equal(result.financedAmount, 20_000_000);
  assert.equal(result.interestAmount, 400_000); // 20m * 2%
  assert.equal(result.mode, "credit_card");
  assert.ok(result.monthlyPayment > 0);
});

test("Amortization schedule generates correct number of rows and balances out", () => {
  const financed = 12_000_000;
  const term = 6;
  const monthlyPayment = 2_100_000;
  const interestAmount = 600_000;

  const schedule = generateAmortizationSchedule(financed, term, monthlyPayment, interestAmount);
  assert.equal(schedule.length, 6);
  assert.equal(schedule[0].month, 1);
  assert.equal(schedule[schedule.length - 1].endingBalance, 0);
});

