import { Module } from "@nestjs/common";
import { EmailModule } from "../email/email.module";
import { CompaniesController } from "./companies.controller";

@Module({
  imports: [EmailModule], controllers: [CompaniesController] })
export class CompaniesModule {}
