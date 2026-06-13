import { ZW_CONFIG, KE_CONFIG, ZM_CONFIG, MW_CONFIG, MZ_CONFIG, NA_CONFIG, NG_CONFIG, GH_CONFIG, UG_CONFIG } from "./payroll-countries";
// ─────────────────────────────────────────────────────────────────────────────
// 7D Global Projects Payroll Engine — Multi-Country Edition
// ─────────────────────────────────────────────────────────────────────────────

export type PayType = "FIXED" | "HOURLY" | "DAILY";
export type CurrencyCode = "TZS" | "USD" | "BWP" | "ZAR" | "ZWL" | "KES" | "ZMW" | "MWK" | "MZN" | "NAD" | "NGN" | "GHS" | "UGX" | "GBP" | "EUR";
export type CountryCode = "TZ" | "BW" | "ZA" | "ZW" | "KE" | "ZM" | "MW" | "MZ" | "NA" | "NG" | "GH" | "UG" | "OTHER";

// ── Tanzania config ──────────────────────────────────────────────────────────
export const TZ_CONFIG = {
  country: "TZ" as CountryCode,
  currency: "TZS" as CurrencyCode,
  payeBands: [
    { min: 0,       max: 270000,   rate: 0,    base: 0 },
    { min: 270000,  max: 520000,   rate: 0.09, base: 0 },
    { min: 520000,  max: 760000,   rate: 0.20, base: 22500 },
    { min: 760000,  max: 1000000,  rate: 0.25, base: 70500 },
    { min: 1000000, max: Infinity, rate: 0.30, base: 130500 },
  ],
  pensionEERate:  0.10,
  pensionERRate:  0.10,
  pensionCap:     720000,
  sdlRate:        0.045,
  wcfRate:        0.01,
  annualLeaveDays: 28,
  sickLeaveDays:   126,
  pensionLabel:   "NSSF",
  taxIdLabel:     "TIN",
  filingDeadlines: {
    paye: "15th of following month",
    nssf: "Month end",
    wcf:  "31 March annually",
    p9a:  "31 January",
  },
};

// ── Botswana config ──────────────────────────────────────────────────────────
export const BW_CONFIG = {
  country: "BW" as CountryCode,
  currency: "BWP" as CurrencyCode,
  payeBands: [
    // Monthly bands (BURS 2025/26 — top rate raised to 26.5% per Feb 2025 Budget)
    { min: 0,     max: 4000,    rate: 0,      base: 0 },
    { min: 4000,  max: 7000,    rate: 0.05,   base: 0 },
    { min: 7000,  max: 10000,   rate: 0.125,  base: 150 },
    { min: 10000, max: 13000,   rate: 0.1875, base: 525 },
    { min: 13000, max: 16000,   rate: 0.25,   base: 1087.5 },
    { min: 16000, max: Infinity, rate: 0.265, base: 1837.5 },
  ],
  pensionEERate:  0.05,
  pensionERRate:  0.10,
  pensionCap:     null,
  sdlRate:        0,
  wcfRate:        0,
  levyRate:       0.005,
  annualLeaveDays: 15,
  sickLeaveDays:   24,
  pensionLabel:   "BPOPF",
  taxIdLabel:     "BURS TIN",
  filingDeadlines: {
    paye: "15th of following month to BURS",
    itw:  "Monthly ITW return",
    annual: "30 April",
  },
};


// ── South Africa SARS 2025/2026 ──────────────────────────────────────────────
export const ZA_CONFIG = {
  country: "ZA" as CountryCode,
  currency: "ZAR",
  pensionLabel: "UIF",
  taxIdLabel: "SARS Tax Number",
  // SARS 2025/26 PAYE bands — monthly thresholds (annual / 12)
  payeBands: [
    { from: 0,      to: 19758,   rate: 0.18, base: 0        },
    { from: 19759,  to: 30875,   rate: 0.26, base: 3556.44  },
    { from: 30876,  to: 42733,   rate: 0.31, base: 6447.66  },
    { from: 42734,  to: 56083,   rate: 0.36, base: 10122.89 },
    { from: 56084,  to: 71492,   rate: 0.39, base: 14929.73 },
    { from: 71493,  to: 151417,  rate: 0.41, base: 20938.18 },
    { from: 151418, to: Infinity, rate: 0.45, base: 53707.36 },
  ],
  // Primary rebate R17,235/year = R1,436.25/month (reduces PAYE payable)
  primaryRebate: 1436.25,
  // UIF: 1% employee + 1% employer, capped at R177.12/month
  pensionEERate: 0.01,
  pensionERRate: 0.01,
  pensionCap: 177.12,
  // SDL: 1% (Skills Development Levy)
  sdlRate: 0.01,
  // COID (Workers Compensation) — approx 1%, varies by industry
  wcfRate: 0.01,
  // Leave entitlements (SA Basic Conditions of Employment Act)
  annualLeaveDays: 21,  // 3 weeks per year
  sickLeaveDays: 30,    // 30 days per 3-year cycle
};

export const COUNTRY_CONFIGS: Record<CountryCode, typeof TZ_CONFIG | typeof BW_CONFIG> = {
  TZ: TZ_CONFIG,
  BW: BW_CONFIG as any,
  ZA: ZA_CONFIG as any,
  ZW: ZW_CONFIG as any,
  KE: KE_CONFIG as any,
  ZM: ZM_CONFIG as any,
  MW: MW_CONFIG as any,
  MZ: MZ_CONFIG as any,
  NA: NA_CONFIG as any,
  NG: NG_CONFIG as any,
  GH: GH_CONFIG as any,
  UG: UG_CONFIG as any,
  OTHER: { ...TZ_CONFIG, country: "OTHER", currency: "USD" } as any,
};

// Legacy exports for backward compat
export const PAYE_BANDS = TZ_CONFIG.payeBands;
export const NSSF_RATE = TZ_CONFIG.pensionEERate;
export const NSSF_CAP  = TZ_CONFIG.pensionCap;
export const SDL_RATE  = TZ_CONFIG.sdlRate;
export const WCF_RATE  = TZ_CONFIG.wcfRate;
export const STANDARD_DAYS  = 26;
export const STANDARD_HOURS = 9;

// ── Helpers ──────────────────────────────────────────────────────────────────
const n = (v: number | null | undefined): number => Number(v ?? 0);
export const roundMoney = (v: number): number => Math.round((v + Number.EPSILON) * 100) / 100;

export function getPAYEBands(country: CountryCode = "TZ") {
  return (COUNTRY_CONFIGS[country] ?? TZ_CONFIG).payeBands;
}

export function calculatePAYE(grossAmount: number, country: CountryCode = "TZ"): number {
  if (grossAmount <= 0) return 0;
  const bands = getPAYEBands(country);
  for (const band of bands) {
    if (grossAmount <= band.max) {
      if (band.rate === 0) return 0;
      return roundMoney(band.base + (grossAmount - band.min) * band.rate);
    }
  }
  return 0;
}

export function calculateSeverance(
  monthlySalary: number,
  completedYears: number,
  reason: "misconduct" | "resignation" | "contract_expiry" | "retrenchment" | "other",
  country: CountryCode = "TZ",
): number {
  if (["misconduct", "resignation", "contract_expiry"].includes(reason)) return 0;
  if (country === "BW") {
    // BW: 1 week per completed year
    const weeklyRate = monthlySalary / 4.33;
    return roundMoney(weeklyRate * Math.max(completedYears, 0));
  }
  // TZ: 7 days per completed year, max 10 years
  return roundMoney((monthlySalary / 30) * 7 * Math.min(Math.max(completedYears, 0), 10));
}

export function isActiveForPeriod(
  startDate: Date,
  endDate: Date | null,
  periodYear: number,
  periodMonth: number,
): boolean {
  const firstDay = new Date(periodYear, periodMonth - 1, 1);
  const lastDay  = new Date(periodYear, periodMonth, 0);
  return startDate <= lastDay && (!endDate || endDate >= firstDay);
}

// ── Main calculation input ────────────────────────────────────────────────────
export type PayrollCalculationInput = {
  payType:           PayType;
  currency:          string;
  periodMonth:       number;
  periodYear:        number;
  startDate:         string | Date;
  endDate?:          string | Date | null;
  country?:          CountryCode;
  // Salary
  fixedSalaryTzs?:   number | null;  // local currency salary
  usdSalary?:        number | null;
  exchangeRate?:     number | null;
  hourlyRateTzs?:    number | null;  // local currency hourly rate
  stdHoursPerMonth?: number | null;
  // Hours worked (HOURLY employees)
  actualHoursWorked?: number | null;
  // Variable pay
  otHours?:          number | null;  // OT 1.5x
  ot20Hours?:        number | null;  // OT 2.0x
  phHours?:          number | null;  // Public holiday 2.0x
  standbyDays?:      number | null;
  standbyDailyRate?: number | null;
  callout15Hours?:   number | null;
  callout20Hours?:   number | null;
  bonus?:            number | null;
  // Allowances
  housingAllowance?:    number | null;
  transportAllowance?:  number | null;
  siteAllowance?:       number | null;
  otherAdditions?:      number | null;
  // Deductions
  otherDeductions?:     number | null;
  adjustments?:         number | null;
  // Run-level toggles
  deductionsActive?:    boolean;
  workingDays?:         number;
  standardHoursPerDay?: number;
};

export type PayrollCalculationResult = {
  active:              boolean;
  proRataDays:         number;
  daysInMonth:         number;
  monthlySalaryLocal:  number;
  hourlyRateLocal:     number;
  actualHoursWorked:   number;
  basicPay:            number;
  otPay:               number;
  ot20Pay:             number;
  phPay:               number;
  standbyPay:          number;
  callout15Pay:        number;
  callout20Pay:        number;
  bonus:               number;
  grossPay:            number;
  taxablePay:          number;
  paye:                number;
  pensionEmployee:     number;  // NSSF (TZ) or BPOPF (BW)
  pensionEmployer:     number;
  sdl:                 number;
  wcf:                 number;
  levy:                number;
  aidsLevy:            number;  // ZW only: 3% of PAYE
  otherDeductions:     number;
  adjustments:         number;
  netPay:              number;
  totalEmployerCost:   number;
  deductionsActive:    boolean;
  country:             CountryCode;
  // Legacy aliases
  nssfEmployee:        number;
  nssfEmployer:        number;
};

export function calculatePayrollLine(input: PayrollCalculationInput): PayrollCalculationResult {
  const country: CountryCode = (input.country ?? "TZ") as CountryCode;
  const config = COUNTRY_CONFIGS[country] ?? TZ_CONFIG;
  const deductionsActive = input.deductionsActive !== false; // default true

  const startDate = new Date(input.startDate);
  const endDate   = input.endDate ? new Date(input.endDate) : null;
  const daysInMonth = new Date(input.periodYear, input.periodMonth, 0).getDate();
  const active = isActiveForPeriod(startDate, endDate, input.periodYear, input.periodMonth);

  const zero: PayrollCalculationResult = {
    active, proRataDays: 0, daysInMonth,
    monthlySalaryLocal: 0, hourlyRateLocal: 0, actualHoursWorked: 0,
    basicPay: 0, otPay: 0, ot20Pay: 0, phPay: 0, standbyPay: 0,
    callout15Pay: 0, callout20Pay: 0, bonus: 0,
    grossPay: 0, taxablePay: 0, paye: 0,
    pensionEmployee: 0, pensionEmployer: 0, sdl: 0, wcf: 0, levy: 0, aidsLevy: 0,
    otherDeductions: 0, adjustments: 0, netPay: 0, totalEmployerCost: 0,
    deductionsActive, country,
    nssfEmployee: 0, nssfEmployer: 0,
  };

  if (!active) return zero;

  const workingDays       = n(input.workingDays)       || STANDARD_DAYS;
  const standardHoursPerDay = n(input.standardHoursPerDay) || STANDARD_HOURS;

  // ── Base salary in local currency ───────────────────────────────────────
  const monthlySalaryLocal =
    input.currency === "USD"
      ? n(input.usdSalary) * n(input.exchangeRate)
      : n(input.fixedSalaryTzs);

  // ── Pro-rata for start month ─────────────────────────────────────────────
  const isStartMonth =
    startDate.getFullYear() === input.periodYear &&
    startDate.getMonth() + 1 === input.periodMonth;
  const proRataDays = isStartMonth ? daysInMonth - startDate.getDate() + 1 : daysInMonth;

  // ── Derived hourly rate (used for OT/PH calc for FIXED employees) ────────
  const stdHourlyRate =
    input.payType === "HOURLY"
      ? n(input.hourlyRateTzs)
      : monthlySalaryLocal / (workingDays * standardHoursPerDay);

  const hourlyRateLocal = stdHourlyRate;

  // ── Basic pay ────────────────────────────────────────────────────────────
  const actualHoursWorked =
    input.payType === "HOURLY"
      ? n(input.actualHoursWorked) || n(input.stdHoursPerMonth) || 234
      : 0;

  const basicPay =
    input.payType === "HOURLY"
      ? actualHoursWorked * hourlyRateLocal
      : monthlySalaryLocal * (proRataDays / daysInMonth);

  // ── Variable pay ─────────────────────────────────────────────────────────
  const otPay       = n(input.otHours)       * hourlyRateLocal * 1.5;
  const ot20Pay     = n(input.ot20Hours)     * hourlyRateLocal * 2.0;
  const phPay       = n(input.phHours)       * hourlyRateLocal * 2.0;
  const standbyPay  = n(input.standbyDays)   * n(input.standbyDailyRate);
  const callout15Pay = n(input.callout15Hours) * hourlyRateLocal * 1.5;
  const callout20Pay = n(input.callout20Hours) * hourlyRateLocal * 2.0;
  const bonus       = n(input.bonus);

  // ── Gross ────────────────────────────────────────────────────────────────
  const grossPay = roundMoney(
    basicPay + otPay + ot20Pay + phPay +
    standbyPay + callout15Pay + callout20Pay + bonus +
    n(input.housingAllowance) + n(input.transportAllowance) +
    n(input.siteAllowance) + n(input.otherAdditions),
  );

  // ── Statutory deductions ─────────────────────────────────────────────────
  let pensionEmployee = 0;
  let pensionEmployer = 0;
  let paye            = 0;
  let aidsLevy        = 0;
  let sdl             = 0;
  let wcf             = 0;
  let levy            = 0;

  if (deductionsActive) {
    const pensionEERate = config.pensionEERate;
    const pensionERRate = config.pensionERRate;
    const pensionCap    = (config as any).pensionCap ?? null;

    pensionEmployee = pensionCap
      ? roundMoney(Math.min(grossPay * pensionEERate, pensionCap))
      : roundMoney(grossPay * pensionEERate);

    pensionEmployer = pensionCap
      ? roundMoney(Math.min(grossPay * pensionERRate, pensionCap))
      : roundMoney(grossPay * pensionERRate);

    const rawPaye = calculatePAYE(grossPay, country);
    // Apply monthly tax credit (ZW only: $100/month reduces PAYE payable)
    const taxCredit = (config as any).monthlyTaxCredit ?? 0;
    paye = Math.max(0, roundMoney(rawPaye - taxCredit));
    // AIDS levy: 3% of PAYE payable (ZW only)
    aidsLevy = (config as any).aidsLevyRate ? roundMoney(paye * (config as any).aidsLevyRate) : 0;
    sdl  = config.sdlRate  ? roundMoney(grossPay * config.sdlRate)  : 0;
    wcf  = config.wcfRate  ? roundMoney(grossPay * config.wcfRate)  : 0;
    levy = (config as any).levyRate ? roundMoney(grossPay * (config as any).levyRate) : 0;
  }

  const otherDeductions = n(input.otherDeductions);
  const adjustments     = n(input.adjustments);
  const taxablePay      = roundMoney(grossPay - pensionEmployee);
  const netPay          = roundMoney(grossPay - pensionEmployee - paye - aidsLevy - otherDeductions + adjustments);
  const totalEmployerCost = roundMoney(grossPay + pensionEmployer + sdl + wcf + levy);

  return {
    active, proRataDays, daysInMonth,
    monthlySalaryLocal: roundMoney(monthlySalaryLocal),
    hourlyRateLocal: roundMoney(hourlyRateLocal),
    actualHoursWorked: roundMoney(actualHoursWorked),
    basicPay:      roundMoney(basicPay),
    otPay:         roundMoney(otPay),
    ot20Pay:       roundMoney(ot20Pay),
    phPay:         roundMoney(phPay),
    standbyPay:    roundMoney(standbyPay),
    callout15Pay:  roundMoney(callout15Pay),
    callout20Pay:  roundMoney(callout20Pay),
    bonus:         roundMoney(bonus),
    grossPay,
    taxablePay,
    paye,
    pensionEmployee,
    pensionEmployer,
    sdl,
    wcf,
    levy,
    aidsLevy,
    otherDeductions,
    adjustments,
    netPay,
    totalEmployerCost,
    deductionsActive,
    country,
    // Legacy aliases
    nssfEmployee: pensionEmployee,
    nssfEmployer: pensionEmployer,
  };
}

// ── Sage Guide Ch. 13: Pay Cycle support ────────────────────────────────────
export type PayCycle = "WEEKLY" | "BIWEEKLY" | "SEMIMONTHLY" | "MONTHLY";

export function getPayCyclePeriods(cycle: PayCycle): number {
  const map: Record<PayCycle, number> = {
    WEEKLY:      52,
    BIWEEKLY:    26,
    SEMIMONTHLY: 24,
    MONTHLY:     12,
  };
  return map[cycle] ?? 12;
}

export function getPayCycleDivisor(cycle: PayCycle): number {
  return getPayCyclePeriods(cycle) / 12;
}

// ── Sage Guide Ch. 9: Leave Accrual ─────────────────────────────────────────
export type LeaveAccrualResult = {
  annualLeaveDaysEarned:  number;
  sickLeaveDaysEarned:    number;
  annualLeaveDaysPerYear: number;
  sickLeaveDaysPerYear:   number;
  tenureYears:            number;
  tenureMonths:           number;
};

export function calculateLeaveAccrual(
  startDate:   Date | string,
  periodYear:  number,
  periodMonth: number,
  country:     CountryCode = "TZ",
): LeaveAccrualResult {
  const config = COUNTRY_CONFIGS[country] ?? TZ_CONFIG;
  const start = new Date(startDate);
  const periodEnd = new Date(periodYear, periodMonth, 0); // last day of period month

  const tenureMs = periodEnd.getTime() - start.getTime();
  const tenureYears  = Math.max(0, tenureMs / (365.25 * 24 * 3600 * 1000));
  const tenureMonths = Math.max(0, tenureYears * 12);

  const annualDaysPerYear = config.annualLeaveDays;
  const sickDaysPerYear   = config.sickLeaveDays;

  // Pro-rate: accrual = total entitlement / 12 per month worked
  const monthsWorked = Math.floor(tenureMonths);
  const annualLeaveDaysEarned = roundMoney((annualDaysPerYear / 12) * monthsWorked);
  const sickLeaveDaysEarned   = roundMoney((sickDaysPerYear   / 12) * monthsWorked);

  return {
    annualLeaveDaysEarned,
    sickLeaveDaysEarned,
    annualLeaveDaysPerYear: annualDaysPerYear,
    sickLeaveDaysPerYear:   sickDaysPerYear,
    tenureYears:  roundMoney(tenureYears),
    tenureMonths: roundMoney(tenureMonths),
  };
}

// ── Sage Guide Ch. 4: Earnings type tax rules ────────────────────────────────
export type EarningsType = "REGULAR" | "OVERTIME" | "DOUBLE_OT" | "BONUS" | "COMMISSION" | "ALLOWANCE" | "REIMBURSEMENT" | "FRINGE";
export type TaxRule = "TAXABLE" | "NON_TAXABLE" | "SUPPLEMENTAL";

export function isEarningsTaxable(taxRule: TaxRule): boolean {
  return taxRule !== "NON_TAXABLE";
}
