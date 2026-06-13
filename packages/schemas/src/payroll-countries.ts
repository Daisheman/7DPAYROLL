// ─────────────────────────────────────────────────────────────────────────────
// Additional Country Configs — 7D Global Projects Payroll Engine
// ─────────────────────────────────────────────────────────────────────────────

// ── Zimbabwe (ZIMRA 2026 — USD bands, current) ───────────────────────────────
export const ZW_CONFIG = {
  country: "ZW",
  currency: "USD",
  // ZIMRA 2026 USD monthly PAYE bands (source: ZIMRA via zimtax.co.zw/payecalculator.co.zw)
  // Calculation: annualise monthly gross × 12, apply bands, ÷ 12, deduct tax credit, + AIDS levy
  payeBands: [
    { min: 0,    max: 100,  rate: 0,    base: 0 },
    { min: 100,  max: 300,  rate: 0.20, base: 0 },
    { min: 300,  max: 750,  rate: 0.25, base: 40 },
    { min: 750,  max: 1800, rate: 0.30, base: 152.5 },
    { min: 1800, max: Infinity, rate: 0.40, base: 467.5 },
  ],
  // Monthly tax credit reduces PAYE payable (USD 1,200/year ÷ 12)
  monthlyTaxCredit: 100,
  // AIDS Levy: 3% of PAYE payable (not on gross)
  aidsLevyRate: 0.03,
  // NSSA: 4.5% employee + 4.5% employer, capped at USD 700/month insurable earnings
  pensionEERate: 0.045,
  pensionERRate: 0.045,
  pensionCap: 700 * 0.045, // Max contribution = 700 × 4.5% = 31.5 USD/month
  sdlRate: 0,
  wcfRate: 0,
  annualLeaveDays: 30,
  sickLeaveDays: 90,
  pensionLabel: "NSSA",
  taxIdLabel: "ZIMRA TIN",
  filingDeadlines: {
    paye: "10th of following month",
    aidsLevy: "10th of following month (remitted with PAYE)",
    nssa: "Month end",
    annual: "28 February (P16 reconciliation)",
  },
};

// ── Kenya (KRA 2024) ──────────────────────────────────────────────────────────
export const KE_CONFIG = {
  country: "KE",
  currency: "KES",
  payeBands: [
    { min: 0,      max: 24000,  rate: 0.10, base: 0 },
    { min: 24000,  max: 32333,  rate: 0.25, base: 2400 },
    { min: 32333,  max: 500000, rate: 0.30, base: 4483 },
    { min: 500000, max: 800000, rate: 0.325,base: 144483 },
    { min: 800000, max: Infinity, rate: 0.35, base: 242233 },
  ],
  personalRelief: 2400, // KES per month
  pensionEERate: 0.06,  // NSSF Tier I+II employee
  pensionERRate: 0.06,
  pensionCap: 2160,     // KES per month cap
  sdlRate: 0,
  wcfRate: 0,
  nhifRate: 0,          // NHIF handled separately — tiered
  annualLeaveDays: 21,
  sickLeaveDays: 30,
  pensionLabel: "NSSF",
  taxIdLabel: "KRA PIN",
  filingDeadlines: {
    paye: "9th of following month",
    nssf: "Month end",
    nhif: "9th of following month",
    annual: "30 June",
  },
};

// ── Zambia (ZRA 2024) ─────────────────────────────────────────────────────────
export const ZM_CONFIG = {
  country: "ZM",
  currency: "ZMW",
  payeBands: [
    { min: 0,      max: 4800,  rate: 0,     base: 0 },
    { min: 4800,   max: 9200,  rate: 0.20,  base: 0 },
    { min: 9200,   max: 23900, rate: 0.30,  base: 880 },
    { min: 23900,  max: Infinity, rate: 0.375, base: 5290 },
  ],
  pensionEERate: 0.05,
  pensionERRate: 0.05,
  pensionCap: 1221.80, // ZMW per month cap
  sdlRate: 0,
  wcfRate: 0,
  annualLeaveDays: 24,
  sickLeaveDays: 30,
  pensionLabel: "NAPSA",
  taxIdLabel: "TPIN",
  filingDeadlines: {
    paye: "10th of following month",
    napsa: "10th of following month",
    annual: "31 March",
  },
};

// ── Malawi (MRA 2024) ─────────────────────────────────────────────────────────
export const MW_CONFIG = {
  country: "MW",
  currency: "MWK",
  payeBands: [
    { min: 0,       max: 100000,  rate: 0,    base: 0 },
    { min: 100000,  max: 385000,  rate: 0.25, base: 0 },
    { min: 385000,  max: Infinity, rate: 0.35, base: 71250 },
  ],
  pensionEERate: 0.05,
  pensionERRate: 0.10,
  pensionCap: null,
  sdlRate: 0,
  wcfRate: 0,
  annualLeaveDays: 18,
  sickLeaveDays: 30,
  pensionLabel: "MASM",
  taxIdLabel: "TPIN",
  filingDeadlines: {
    paye: "14th of following month",
    masm: "14th of following month",
    annual: "30 June",
  },
};

// ── Mozambique (AT 2024) ──────────────────────────────────────────────────────
export const MZ_CONFIG = {
  country: "MZ",
  currency: "MZN",
  payeBands: [
    { min: 0,      max: 20249,  rate: 0.10, base: 0 },
    { min: 20249,  max: 30374,  rate: 0.15, base: 2025 },
    { min: 30374,  max: 40499,  rate: 0.20, base: 3544 },
    { min: 40499,  max: 56249,  rate: 0.25, base: 5569 },
    { min: 56249,  max: Infinity, rate: 0.32, base: 9506 },
  ],
  pensionEERate: 0.03,
  pensionERRate: 0.04,
  pensionCap: null,
  sdlRate: 0,
  wcfRate: 0,
  annualLeaveDays: 30,
  sickLeaveDays: 30,
  pensionLabel: "INSS",
  taxIdLabel: "NUIT",
  filingDeadlines: {
    paye: "20th of following month",
    inss: "15th of following month",
    annual: "31 March",
  },
};

// ── Namibia (NamRA 2024/25) ───────────────────────────────────────────────────
export const NA_CONFIG = {
  country: "NA",
  currency: "NAD",
  // Annual bands converted to monthly
  payeBands: [
    { min: 0,      max: 4167,   rate: 0,    base: 0 },      // 0-50k/yr
    { min: 4167,   max: 8333,   rate: 0.18, base: 0 },      // 50k-100k/yr
    { min: 8333,   max: 25000,  rate: 0.25, base: 750 },    // 100k-300k/yr
    { min: 25000,  max: 41667,  rate: 0.28, base: 4917 },   // 300k-500k/yr
    { min: 41667,  max: 66667,  rate: 0.30, base: 9583 },   // 500k-800k/yr
    { min: 66667,  max: 125000, rate: 0.32, base: 17083 },  // 800k-1.5m/yr
    { min: 125000, max: Infinity, rate: 0.37, base: 35750 },// >1.5m/yr
  ],
  pensionEERate: 0.009,
  pensionERRate: 0.009,
  pensionCap: 81,    // NAD per month cap (NAD 972/yr)
  sdlRate: 0,
  wcfRate: 0,
  annualLeaveDays: 24,
  sickLeaveDays: 30,
  pensionLabel: "Social Security",
  taxIdLabel: "NamRA TIN",
  filingDeadlines: {
    paye: "20th of following month",
    socialSecurity: "Month end",
    annual: "30 June",
  },
};

// ── Nigeria (FIRS PITA 2024) ──────────────────────────────────────────────────
export const NG_CONFIG = {
  country: "NG",
  currency: "NGN",
  // Monthly bands (annual / 12)
  payeBands: [
    { min: 0,       max: 25000,  rate: 0.07, base: 0 },
    { min: 25000,   max: 50000,  rate: 0.11, base: 1750 },
    { min: 50000,   max: 91667,  rate: 0.15, base: 4500 },
    { min: 91667,   max: 133333, rate: 0.19, base: 10750 },
    { min: 133333,  max: 266667, rate: 0.21, base: 18667 },
    { min: 266667,  max: Infinity, rate: 0.24, base: 46667 },
  ],
  personalAllowanceRate: 0.20, // 20% of gross
  personalAllowanceMin: 200000 / 12, // or NGN 200,000/yr whichever is higher
  pensionEERate: 0.08,  // 8% employee pension
  pensionERRate: 0.10,  // 10% employer pension
  pensionCap: null,
  nhfRate: 0.025,       // NHF 2.5% employee
  sdlRate: 0,
  wcfRate: 0.01,        // NSITF 1% employer
  annualLeaveDays: 21,
  sickLeaveDays: 12,
  pensionLabel: "PENCOM",
  taxIdLabel: "TIN",
  filingDeadlines: {
    paye: "10th of following month",
    pension: "7th of following month",
    annual: "31 March",
  },
};

// ── Ghana (GRA 2024) ──────────────────────────────────────────────────────────
export const GH_CONFIG = {
  country: "GH",
  currency: "GHS",
  payeBands: [
    { min: 0,       max: 490,    rate: 0,     base: 0 },
    { min: 490,     max: 600,    rate: 0.05,  base: 0 },
    { min: 600,     max: 730,    rate: 0.10,  base: 5.5 },
    { min: 730,     max: 3897,   rate: 0.175, base: 18.5 },
    { min: 3897,    max: 20000,  rate: 0.25,  base: 572.7 },
    { min: 20000,   max: Infinity, rate: 0.30, base: 4599.7 },
  ],
  pensionEERate: 0.055,  // SSNIT 5.5%
  pensionERRate: 0.13,   // SSNIT 13% (12.5% SSNIT + 0.5% NHT)
  pensionCap: null,
  sdlRate: 0,
  wcfRate: 0,
  annualLeaveDays: 15,
  sickLeaveDays: 12,
  pensionLabel: "SSNIT",
  taxIdLabel: "TIN",
  filingDeadlines: {
    paye: "15th of following month",
    ssnit: "14th of following month",
    annual: "30 April",
  },
};

// ── Uganda (URA 2024/25) ──────────────────────────────────────────────────────
export const UG_CONFIG = {
  country: "UG",
  currency: "UGX",
  payeBands: [
    { min: 0,         max: 235000,   rate: 0,    base: 0 },
    { min: 235000,    max: 335000,   rate: 0.10, base: 0 },
    { min: 335000,    max: 410000,   rate: 0.20, base: 10000 },
    { min: 410000,    max: 10000000, rate: 0.30, base: 25000 },
    { min: 10000000,  max: Infinity, rate: 0.40, base: 2902000 },
  ],
  pensionEERate: 0.05,
  pensionERRate: 0.10,
  pensionCap: null,
  sdlRate: 0,
  wcfRate: 0,
  annualLeaveDays: 21,
  sickLeaveDays: 30,
  pensionLabel: "NSSF",
  taxIdLabel: "TIN",
  filingDeadlines: {
    paye: "15th of following month",
    nssf: "15th of following month",
    annual: "31 December",
  },
};
