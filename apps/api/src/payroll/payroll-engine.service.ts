import { Injectable } from "@nestjs/common";
import { calculatePayrollLine, calculatePAYE, calculateSeverance, PayrollCalculationInput, CountryCode } from "@payroll/schemas";

@Injectable()
export class PayrollEngineService {
  calculate(input: PayrollCalculationInput) {
    return calculatePayrollLine(input);
  }

  calculatePAYE(gross: number, country: CountryCode = "TZ") {
    return calculatePAYE(gross, country);
  }

  calculateSeverance(
    monthlySalary: number,
    completedYears: number,
    reason: "misconduct" | "resignation" | "contract_expiry" | "retrenchment" | "other",
    country: CountryCode = "TZ",
  ) {
    return calculateSeverance(monthlySalary, completedYears, reason, country);
  }
}
