export const MIN_INSTALLMENT_TOTAL = 8_000_000;
export const DOWN_PAYMENT_OPTIONS = [10, 20, 30, 40, 50] as const;
export const INSTALLMENT_TERMS = [6, 9, 12, 15] as const;

export interface FinanceCompany {
  id: string;
  name: string;
  badge: string;
  logo: string;
  monthlyRate: number;
  minDownPayment: number;
  approvalTime: string;
  requirements: string;
  highlight: string;
}

export const FINANCE_COMPANIES: readonly FinanceCompany[] = [
  {
    id: "fe-credit",
    name: "FE Credit",
    badge: "Phổ biến nhất",
    logo: "/finance/fe-credit-official.svg",
    monthlyRate: 1.86,
    minDownPayment: 10,
    approvalTime: "15 phút",
    requirements: "CCCD gắn chip (18 - 60 tuổi)",
    highlight: "Gói 0% cho 6 tháng đầu hoặc lãi suất phẳng cố định",
  },
  {
    id: "hd-saison",
    name: "HD Saison",
    badge: "Hạn mức cao",
    logo: "/finance/hd-saison-official.png",
    monthlyRate: 1.65,
    minDownPayment: 10,
    approvalTime: "20 phút",
    requirements: "CCCD gắn chip (19 - 60 tuổi)",
    highlight: "Lãi suất ưu đãi cho thiết bị Apple & Laptop cao cấp",
  },
  {
    id: "kredivo",
    name: "Kredivo",
    badge: "Duyệt qua App 5p",
    logo: "/finance/kredivo-official.png",
    monthlyRate: 1.68,
    minDownPayment: 0,
    approvalTime: "5 phút",
    requirements: "Tài khoản Kredivo đã kích hoạt",
    highlight: "Trả trước 0đ, thanh toán linh hoạt qua ứng dụng",
  },
  {
    id: "shinhan-finance",
    name: "Shinhan Finance",
    badge: "Chuẩn Hàn Quốc",
    logo: "/finance/shinhan-finance-official.png",
    monthlyRate: 1.82,
    minDownPayment: 20,
    approvalTime: "15 phút",
    requirements: "CCCD gắn chip (20 - 55 tuổi)",
    highlight: "Dịch vụ tài chính cao cấp, minh bạch không phát sinh phí ẩn",
  },
] as const;

export interface CreditCardBank {
  id: string;
  name: string;
  shortName: string;
  color: string;
  logoText: string;
  supportedTerms: number[];
  conversionFeeRate: Record<number, number>; // term -> percentage fee
}

export const CREDIT_CARD_BANKS: CreditCardBank[] = [
  {
    id: "techcombank",
    name: "Techcombank",
    shortName: "TCB",
    color: "#e51b24",
    logoText: "TECHCOMBANK",
    supportedTerms: [3, 6, 9, 12],
    conversionFeeRate: { 3: 1.5, 6: 2.0, 9: 2.8, 12: 3.5 },
  },
  {
    id: "vietcombank",
    name: "Vietcombank",
    shortName: "VCB",
    color: "#005a3c",
    logoText: "VIETCOMBANK",
    supportedTerms: [3, 6, 9, 12],
    conversionFeeRate: { 3: 1.6, 6: 2.2, 9: 2.9, 12: 3.6 },
  },
  {
    id: "vpbank",
    name: "VPBank",
    shortName: "VPB",
    color: "#00914c",
    logoText: "VPBANK",
    supportedTerms: [3, 6, 9, 12, 18, 24],
    conversionFeeRate: { 3: 1.4, 6: 1.9, 9: 2.7, 12: 3.4, 18: 4.8, 24: 6.2 },
  },
  {
    id: "mbbank",
    name: "MB Bank",
    shortName: "MB",
    color: "#1c3c97",
    logoText: "MB BANK",
    supportedTerms: [3, 6, 9, 12],
    conversionFeeRate: { 3: 1.5, 6: 2.1, 9: 2.8, 12: 3.5 },
  },
  {
    id: "tpbank",
    name: "TPBank",
    shortName: "TPB",
    color: "#5b2c83",
    logoText: "TPBANK",
    supportedTerms: [3, 6, 9, 12],
    conversionFeeRate: { 3: 1.5, 6: 2.0, 9: 2.8, 12: 3.5 },
  },
  {
    id: "acb",
    name: "ACB",
    shortName: "ACB",
    color: "#0066b3",
    logoText: "ACB BANK",
    supportedTerms: [3, 6, 9, 12],
    conversionFeeRate: { 3: 1.5, 6: 2.0, 9: 2.8, 12: 3.5 },
  },
  {
    id: "sacombank",
    name: "Sacombank",
    shortName: "STB",
    color: "#005596",
    logoText: "SACOMBANK",
    supportedTerms: [3, 6, 9, 12],
    conversionFeeRate: { 3: 1.6, 6: 2.1, 9: 2.9, 12: 3.6 },
  },
  {
    id: "vib",
    name: "VIB",
    shortName: "VIB",
    color: "#0066b2",
    logoText: "VIB BANK",
    supportedTerms: [3, 6, 9, 12],
    conversionFeeRate: { 3: 1.5, 6: 2.0, 9: 2.8, 12: 3.5 },
  },
  {
    id: "hsbc",
    name: "HSBC",
    shortName: "HSBC",
    color: "#db0011",
    logoText: "HSBC",
    supportedTerms: [3, 6, 9, 12],
    conversionFeeRate: { 3: 1.8, 6: 2.4, 9: 3.1, 12: 3.8 },
  },
  {
    id: "bidv",
    name: "BIDV",
    shortName: "BIDV",
    color: "#0c5086",
    logoText: "BIDV",
    supportedTerms: [3, 6, 9, 12],
    conversionFeeRate: { 3: 1.5, 6: 2.1, 9: 2.9, 12: 3.6 },
  },
];

export interface InstallmentCalculationResult {
  term: number;
  downPaymentPercent: number;
  downPaymentAmount: number;
  financedAmount: number;
  interestMonths: number;
  interestAmount: number;
  monthlyPrincipal: number;
  monthlyInterest: number;
  monthlyPayment: number;
  dailyPayment: number;
  totalPayment: number;
  differenceAmount: number;
  mode: "finance_company" | "credit_card";
  conversionFeeRate?: number;
}

export function calculateInstallmentPlan(
  total: number,
  downPaymentPercent: number,
  term: number,
  monthlyRate: number,
): InstallmentCalculationResult {
  const downPaymentAmount = Math.round((total * downPaymentPercent) / 100);
  const financedAmount = Math.max(0, total - downPaymentAmount);
  // Promotional: 0 interest for <= 6 months or preferential months
  const interestMonths = term <= 6 ? 0 : term <= 9 ? 2 : term === 12 ? 3 : term === 18 ? 5 : 7;
  const interestAmount = Math.round(((financedAmount * monthlyRate) / 100) * interestMonths);
  const totalFinancedWithInterest = financedAmount + interestAmount;
  const monthlyPayment = term > 0 ? Math.ceil(totalFinancedWithInterest / term) : 0;
  const monthlyPrincipal = term > 0 ? Math.round(financedAmount / term) : 0;
  const monthlyInterest = term > 0 ? Math.round(interestAmount / term) : 0;
  const totalPayment = downPaymentAmount + monthlyPayment * term;
  const differenceAmount = Math.max(0, totalPayment - total);
  const dailyPayment = Math.ceil(monthlyPayment / 30);

  return {
    term,
    downPaymentPercent,
    downPaymentAmount,
    financedAmount,
    interestMonths,
    interestAmount,
    monthlyPrincipal,
    monthlyInterest,
    monthlyPayment,
    dailyPayment,
    totalPayment,
    differenceAmount,
    mode: "finance_company",
  };
}

export function calculateCreditCardPlan(
  total: number,
  downPaymentPercent: number,
  term: number,
  conversionFeePercent: number = 2.5,
): InstallmentCalculationResult {
  const downPaymentAmount = Math.round((total * downPaymentPercent) / 100);
  const financedAmount = Math.max(0, total - downPaymentAmount);
  const conversionFeeAmount = Math.round((financedAmount * conversionFeePercent) / 100);
  const totalFinanced = financedAmount + conversionFeeAmount;
  const monthlyPayment = term > 0 ? Math.ceil(totalFinanced / term) : 0;
  const monthlyPrincipal = term > 0 ? Math.round(financedAmount / term) : 0;
  const monthlyInterest = term > 0 ? Math.round(conversionFeeAmount / term) : 0;
  const totalPayment = downPaymentAmount + monthlyPayment * term;
  const differenceAmount = Math.max(0, totalPayment - total);
  const dailyPayment = Math.ceil(monthlyPayment / 30);

  return {
    term,
    downPaymentPercent,
    downPaymentAmount,
    financedAmount,
    interestMonths: 0,
    interestAmount: conversionFeeAmount,
    monthlyPrincipal,
    monthlyInterest,
    monthlyPayment,
    dailyPayment,
    totalPayment,
    differenceAmount,
    mode: "credit_card",
    conversionFeeRate: conversionFeePercent,
  };
}

export interface AmortizationRow {
  month: number;
  beginningBalance: number;
  principalPaid: number;
  interestPaid: number;
  totalMonthly: number;
  endingBalance: number;
}

export function generateAmortizationSchedule(
  financedAmount: number,
  term: number,
  monthlyPayment: number,
  interestAmount: number,
): AmortizationRow[] {
  if (term <= 0 || financedAmount <= 0) return [];
  const monthlyInterest = Math.round(interestAmount / term);
  let currentBalance = financedAmount;
  const schedule: AmortizationRow[] = [];

  for (let m = 1; m <= term; m++) {
    const beginningBalance = currentBalance;
    const interestPaid = m === term ? Math.max(0, interestAmount - monthlyInterest * (term - 1)) : monthlyInterest;
    let principalPaid = monthlyPayment - interestPaid;
    if (m === term || principalPaid > currentBalance) {
      principalPaid = currentBalance;
    }
    currentBalance = Math.max(0, currentBalance - principalPaid);
    schedule.push({
      month: m,
      beginningBalance,
      principalPaid,
      interestPaid,
      totalMonthly: principalPaid + interestPaid,
      endingBalance: currentBalance,
    });
  }

  return schedule;
}
