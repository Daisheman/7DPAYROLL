// Re-export all Prisma enums — single source of truth
// In Docker build, @prisma/client has Role but not custom enums
// This file bridges both

export enum Role {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  PAYROLL_MANAGER = "PAYROLL_MANAGER",
  PAYROLL_PROCESSOR = "PAYROLL_PROCESSOR",
  HR_MANAGER = "HR_MANAGER",
  ACCOUNTANT = "ACCOUNTANT",
  AUDITOR = "AUDITOR",
  VIEWER = "VIEWER",
  SUPER_ADMIN = "SUPER_ADMIN",
}

export enum ContractType {
  PERMANENT = "PERMANENT",
  CONTRACT = "CONTRACT",
  CASUAL = "CASUAL",
  INTERN = "INTERN",
  CONSULTANT = "CONSULTANT",
}

export enum EmploymentType {
  FIXED = "FIXED",
  HOURLY = "HOURLY",
  DAILY = "DAILY",
}

export enum AuditAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  APPROVE = "APPROVE",
  LOCK = "LOCK",
  REVERSE = "REVERSE",
  EXPORT = "EXPORT",
  IMPORT = "IMPORT",
}

export enum ResourceType {
  USER = "USER",
  EMPLOYEE = "EMPLOYEE",
  PAYROLL_RUN = "PAYROLL_RUN",
  PAYROLL_LINE = "PAYROLL_LINE",
  LEAVE_REQUEST = "LEAVE_REQUEST",
  COMPANY = "COMPANY",
  COMPANY_SETTING = "COMPANY_SETTING",
  REPORT = "REPORT",
}
