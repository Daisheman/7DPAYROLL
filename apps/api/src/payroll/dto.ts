import { IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsUUID, Max, Min } from "class-validator";

export class CreatePayrollRunDto {
  @IsInt() @Min(1) @Max(12)
  periodMonth!: number;

  @IsInt() @Min(2020) @Max(2100)
  periodYear!: number;

  @IsDateString()
  paymentDate!: string;

  @IsOptional() @IsInt() @Min(1)
  workingDays?: number;

  @IsOptional() @IsNumber() @Min(1)
  standardHoursPerDay?: number;

  @IsOptional() @IsNumber() @Min(1)
  exchangeRate?: number;

  @IsOptional() @IsBoolean()
  deductionsActive?: boolean;

  @IsOptional() @IsArray() @IsUUID("4", { each: true })
  employeeIds?: string[];

  @IsOptional() @IsIn(["WEEKLY", "BIWEEKLY", "SEMIMONTHLY", "MONTHLY"])
  payCycle?: string;
}

export class UpdatePayrollLineDto {
  @IsOptional() @IsNumber() @Min(0)
  actualHours?: number;

  @IsOptional() @IsNumber() @Min(0)
  otHours?: number;

  @IsOptional() @IsNumber() @Min(0)
  ot20Hours?: number;

  @IsOptional() @IsNumber() @Min(0)
  phHours?: number;

  @IsOptional() @IsNumber() @Min(0)
  standbyDays?: number;

  @IsOptional() @IsNumber() @Min(0)
  callout15Hours?: number;

  @IsOptional() @IsNumber() @Min(0)
  callout20Hours?: number;

  @IsOptional() @IsNumber() @Min(0)
  bonus?: number;

  @IsOptional() @IsNumber()
  otherAdditions?: number;

  @IsOptional() @IsNumber()
  otherDeductions?: number;

  @IsOptional() @IsNumber()
  adjustments?: number;
}

export class ToggleDeductionsDto {
  @IsBoolean()
  active!: boolean;
}

export class ReversePayrollRunDto {
  @IsOptional()
  reason?: string;
}
