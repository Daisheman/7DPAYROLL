import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AuditModule } from "./audit/audit.module";
import { AuthModule } from "./auth/auth.module";
import { CompaniesModule } from "./companies/companies.module";
import { DeductionCodesModule } from "./deduction-codes/deduction-codes.module";
import { EarningsCodesModule } from "./earnings-codes/earnings-codes.module";
import { EmployeesModule } from "./employees/employees.module";
import { ImportModule } from "./import/import.module";
import { LeaveModule } from "./leave/leave.module";
import { PayrollModule } from "./payroll/payroll.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ReportsModule } from "./reports/reports.module";
import { StorageModule } from "./storage/storage.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    CompaniesModule,
    EmployeesModule,
    PayrollModule,
    ReportsModule,
    AuditModule,
    StorageModule,
    UsersModule,
    ImportModule,
    LeaveModule,
    EarningsCodesModule,
    DeductionCodesModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
