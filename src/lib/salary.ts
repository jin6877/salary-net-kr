// ============================================================
// 연봉 실수령액 계산 로직 (2024~2025년 기준 요율)
// 요율/상수를 한 곳에 모아 매년 쉽게 갱신할 수 있도록 분리.
// ============================================================

export const BASE_YEAR = "2025";

// --- 4대 보험 요율 (근로자 부담분) ---
export const RATES = {
  // 국민연금: 기준소득월액의 4.5% (근로자), 상·하한 적용
  nationalPension: 0.045,
  // 건강보험: 보수월액의 3.545% (근로자)
  healthInsurance: 0.03545,
  // 장기요양보험: 건강보험료 × 12.95%
  longTermCare: 0.1295,
  // 고용보험(실업급여): 0.9%
  employment: 0.009,
} as const;

// --- 국민연금 기준소득월액 상·하한 (2024.7 ~ 2025.6 적용) ---
export const NP_BASE_MIN = 390_000; // 하한
export const NP_BASE_MAX = 6_170_000; // 상한

// --- 비과세 기본값 (월) ---
export const DEFAULT_NONTAX_MONTHLY = 200_000; // 식대 등 (월 20만원)

// ============================================================
// 근로소득 간이세액표 (근사) — 소득세
// 간이세액표 전체를 내장하기 어려우므로, 근로소득세법상
// 종합소득세 누진세율을 월 단위로 환산해 간이세액표에 근사.
// 부양가족·자녀에 따른 공제를 반영한다.
// ============================================================

// 종합소득세 누진세율 구간 (2023년 개정 이후, 2024~2025 적용)
const INCOME_TAX_BRACKETS: { limit: number; rate: number; deduction: number }[] = [
  { limit: 14_000_000, rate: 0.06, deduction: 0 },
  { limit: 50_000_000, rate: 0.15, deduction: 1_260_000 },
  { limit: 88_000_000, rate: 0.24, deduction: 5_760_000 },
  { limit: 150_000_000, rate: 0.35, deduction: 15_440_000 },
  { limit: 300_000_000, rate: 0.38, deduction: 19_940_000 },
  { limit: 500_000_000, rate: 0.4, deduction: 25_940_000 },
  { limit: 1_000_000_000, rate: 0.42, deduction: 35_940_000 },
  { limit: Infinity, rate: 0.45, deduction: 65_940_000 },
];

// 근로소득공제 (연 총급여 기준)
function earnedIncomeDeduction(grossYear: number): number {
  let d: number;
  if (grossYear <= 5_000_000) d = grossYear * 0.7;
  else if (grossYear <= 15_000_000) d = 3_500_000 + (grossYear - 5_000_000) * 0.4;
  else if (grossYear <= 45_000_000) d = 7_500_000 + (grossYear - 15_000_000) * 0.15;
  else if (grossYear <= 100_000_000) d = 12_000_000 + (grossYear - 45_000_000) * 0.05;
  else d = 14_750_000 + (grossYear - 100_000_000) * 0.02;
  return Math.min(d, 20_000_000); // 한도 2천만원
}

function progressiveTax(base: number): number {
  if (base <= 0) return 0;
  for (const b of INCOME_TAX_BRACKETS) {
    if (base <= b.limit) return base * b.rate - b.deduction;
  }
  return 0;
}

// 근로소득세액공제 (산출세액 기준 근사)
function earnedTaxCredit(calculatedTax: number): number {
  if (calculatedTax <= 1_300_000) return calculatedTax * 0.55;
  return 715_000 + (calculatedTax - 1_300_000) * 0.3;
}

export interface CalcInput {
  annualGross: number; // 세전 연봉 (원)
  nonTaxMonthly: number; // 월 비과세액 (원)
  dependents: number; // 부양가족 수 (본인 포함)
  childrenUnder20: number; // 20세 이하 자녀 수
  severanceIncluded: boolean; // 연봉에 퇴직금 포함 여부
}

export interface DeductionItem {
  key: string;
  label: string;
  monthly: number;
}

export interface CalcResult {
  // 월 기준
  monthlyGross: number; // 월 세전 (퇴직금 제외 반영)
  taxableMonthly: number; // 과세 대상 월급
  nonTaxMonthly: number;
  deductions: DeductionItem[];
  totalDeductionMonthly: number;
  netMonthly: number; // 월 실수령
  // 연 기준
  annualGrossUsed: number; // 계산에 쓰인 연봉(퇴직금 제외 시 보정)
  netAnnual: number;
  totalDeductionAnnual: number;
}

function round(n: number): number {
  return Math.round(n);
}

/**
 * 근로소득 간이세액 (월) 근사 계산.
 * 연 과세소득 기준으로 연간 결정세액을 구한 뒤 12로 나눠 월세액으로 환산.
 * 부양가족/자녀 공제를 반영.
 */
function monthlyIncomeTax(
  taxableMonthly: number,
  dependents: number,
  childrenUnder20: number
): number {
  const grossYear = taxableMonthly * 12; // 연 총급여(과세)
  if (grossYear <= 0) return 0;

  const incomeDeduction = earnedIncomeDeduction(grossYear);

  // 인적공제: 1인당 150만원 (본인 포함 부양가족 수)
  const personalDeduction = Math.max(1, dependents) * 1_500_000;

  // 표준공제 등 기타 근사 (국민연금보험료 소득공제 일부 반영)
  const npDeduction = Math.min(taxableMonthly, NP_BASE_MAX) * RATES.nationalPension * 12;

  const taxBase =
    grossYear - incomeDeduction - personalDeduction - npDeduction;

  let calculatedTax = progressiveTax(taxBase);
  if (calculatedTax <= 0) return 0;

  // 근로소득세액공제
  calculatedTax -= earnedTaxCredit(calculatedTax);

  // 자녀세액공제 (8세 이상 자녀 가정 근사: 1명 15만, 2명 35만, 3명+ 추가 30만/명)
  let childCredit = 0;
  if (childrenUnder20 === 1) childCredit = 150_000;
  else if (childrenUnder20 === 2) childCredit = 350_000;
  else if (childrenUnder20 >= 3) childCredit = 350_000 + (childrenUnder20 - 2) * 300_000;
  calculatedTax -= childCredit;

  const annualTax = Math.max(0, calculatedTax);
  return annualTax / 12;
}

export function calculate(input: CalcInput): CalcResult {
  const { annualGross, nonTaxMonthly, dependents, childrenUnder20, severanceIncluded } = input;

  // 퇴직금 포함 연봉이면 13으로 나눠 실제 월 지급분 추정(13분의 1이 퇴직금적립 가정)
  const annualGrossUsed = severanceIncluded ? (annualGross * 12) / 13 : annualGross;

  const monthlyGross = annualGrossUsed / 12;
  const taxableMonthly = Math.max(0, monthlyGross - nonTaxMonthly);

  // --- 국민연금: 기준소득월액 상하한 적용 ---
  const npBase = Math.min(Math.max(taxableMonthly, 0), NP_BASE_MAX);
  const npBaseClamped = taxableMonthly < NP_BASE_MIN && taxableMonthly > 0
    ? NP_BASE_MIN
    : npBase;
  const nationalPension = taxableMonthly > 0 ? npBaseClamped * RATES.nationalPension : 0;

  // --- 건강보험 ---
  const health = taxableMonthly * RATES.healthInsurance;
  // --- 장기요양 ---
  const longTerm = health * RATES.longTermCare;
  // --- 고용보험 ---
  const employment = taxableMonthly * RATES.employment;

  // --- 소득세 / 지방소득세 ---
  const incomeTax = monthlyIncomeTax(taxableMonthly, dependents, childrenUnder20);
  const localTax = incomeTax * 0.1;

  const deductions: DeductionItem[] = [
    { key: "np", label: "국민연금", monthly: round(nationalPension) },
    { key: "health", label: "건강보험", monthly: round(health) },
    { key: "ltc", label: "장기요양보험", monthly: round(longTerm) },
    { key: "emp", label: "고용보험", monthly: round(employment) },
    { key: "tax", label: "근로소득세", monthly: round(incomeTax) },
    { key: "local", label: "지방소득세", monthly: round(localTax) },
  ];

  const totalDeductionMonthly = deductions.reduce((s, d) => s + d.monthly, 0);
  const netMonthly = round(monthlyGross) - totalDeductionMonthly;

  return {
    monthlyGross: round(monthlyGross),
    taxableMonthly: round(taxableMonthly),
    nonTaxMonthly,
    deductions,
    totalDeductionMonthly,
    netMonthly,
    annualGrossUsed: round(annualGrossUsed),
    netAnnual: netMonthly * 12,
    totalDeductionAnnual: totalDeductionMonthly * 12,
  };
}

export function formatKRW(n: number): string {
  return Math.round(n).toLocaleString("ko-KR");
}

// 억/만원 단위 사람이 읽기 좋은 표기
export function formatEok(n: number): string {
  const eok = Math.floor(n / 100_000_000);
  const man = Math.floor((n % 100_000_000) / 10_000);
  const parts: string[] = [];
  if (eok > 0) parts.push(`${eok}억`);
  if (man > 0) parts.push(`${man.toLocaleString("ko-KR")}만`);
  if (parts.length === 0) return `${n.toLocaleString("ko-KR")}원`;
  return parts.join(" ") + "원";
}
