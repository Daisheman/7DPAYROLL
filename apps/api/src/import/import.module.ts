import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { EmployeesModule } from "../employees/employees.module";
import { PayrollModule } from "../payroll/payroll.module";
import { ImportController } from "./import.controller";
import { ImportService } from "./import.service";

@Module({ imports: [AuditModule, EmployeesModule, PayrollModule], controllers: [ImportController], providers: [ImportService] })
export class ImportModule {}
