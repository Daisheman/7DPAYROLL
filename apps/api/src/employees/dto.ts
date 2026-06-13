import { ApiProperty } from "@nestjs/swagger";
import { ContractType, EmploymentType } from "../prisma/prisma-enums";
import { IsDateString, IsEmail, IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateEmployeeDto {
  @ApiProperty()
  @IsString()
  employeeNumber!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsOptional() @IsString()
  fullName?: string;

  @IsOptional() @IsString()
  title?: string;

  @IsOptional() @IsString()
  department?: string;

  @IsOptional() @IsEnum(ContractType)
  contractType?: ContractType;

  @IsOptional() @IsString()
  currency?: string;

  @IsOptional() @IsNumber() @Min(0)
  usdSalary?: number;

  @IsOptional() @IsNumber() @Min(0)
  stdHoursPerMonth?: number;

  @IsOptional() @IsNumber() @Min(0)
  housingAllowance?: number;

  @IsOptional() @IsNumber() @Min(0)
  transportAllowance?: number;

  @IsOptional() @IsNumber() @Min(0)
  siteAllowance?: number;

  @IsOptional() @IsNumber() @Min(0)
  standbyDailyRate?: number;

  @IsOptional() @IsString()
  nationality?: string;

  @IsOptional() @IsString()
  bankName?: string;

  @IsOptional() @IsString()
  bankAccountNumber?: string;

  @IsOptional() @IsString()
  notes?: string;

  @IsOptional() @IsEmail()
  email?: string;

  @IsOptional() @IsString()
  phone?: string;

  @IsEnum(EmploymentType)
  employmentType!: EmploymentType;

  @IsNumber() @Min(0)
  baseSalary!: number;

  @IsOptional() @IsNumber() @Min(0)
  hourlyRate?: number;

  @IsOptional() @IsNumber() @Min(0)
  dailyRate?: number;

  @IsOptional() @IsString()
  nssfNumber?: string;

  @IsOptional() @IsString()
  taxIdentificationNumber?: string;

  @IsDateString()
  startDate!: string;

  @IsOptional() @IsDateString()
  endDate?: string;
}

export class SalaryHistoryDto {
  @IsDateString()
  effectiveDate!: string;

  @IsEnum(EmploymentType)
  payType!: EmploymentType;

  @IsOptional() @IsNumber()
  fixedSalaryTzs?: number;

  @IsOptional() @IsNumber()
  hourlyRateTzs?: number;

  @IsOptional() @IsNumber()
  stdHoursPerMonth?: number;

  @IsOptional() @IsString()
  currency?: string;

  @IsOptional() @IsNumber()
  usdSalary?: number;

  @IsOptional() @IsNumber()
  exchangeRate?: number;

  @IsOptional() @IsNumber()
  housingAllowance?: number;

  @IsOptional() @IsNumber()
  transportAllow?: number;

  @IsOptional() @IsNumber()
  siteAllowance?: number;

  @IsOptional() @IsString()
  reason?: string;
}
