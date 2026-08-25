export const MIN_INSTALLMENT_TOTAL = 8_000_000;
export const DOWN_PAYMENT_OPTIONS = [10, 20, 30, 40, 50] as const;
export const INSTALLMENT_TERMS = [6, 9, 12, 15] as const;

export const FINANCE_COMPANIES = [
  { name: "FE Credit", logo: "/finance/fe-credit-official.svg", monthlyRate: 1.8 },
  { name: "HD Saison", logo: "/finance/hd-saison-official.png", monthlyRate: 1.65 },
  { name: "Kredivo", logo: "/finance/kredivo-official.png", monthlyRate: 1.68 },
  { name: "Shinhan Finance", logo: "/finance/shinhan-finance-official.png", monthlyRate: 1.86 },
] as const;

export function calculateInstallmentPlan(
  total: number,
  downPaymentPercent: number,
  term: number,
  monthlyRate: number,
) {
  const downPaymentAmount = Math.round(total * downPaymentPercent / 100);
  const financedAmount = Math.max(0, total - downPaymentAmount);
  const interestMonths = term <= 9 ? 0 : term === 12 ? 3 : 6;
  const interestAmount = Math.round(financedAmount * monthlyRate / 100 * interestMonths);
  const monthlyPayment = term > 0 ? Math.ceil((financedAmount + interestAmount) / term) : 0;

  return {
    term,
    downPaymentAmount,
    financedAmount,
    interestMonths,
    interestAmount,
    monthlyPayment,
  };
}
