import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../common/roles.guard";
import { LeaveService } from "./leave.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("leave")
export class LeaveController {
  constructor(private readonly svc: LeaveService) {}

  @Get()
  list(@Req() req: any) {
    return this.svc.list(req.user.companyId);
  }

  @Post()
  create(@Req() req: any, @Body() body: any) {
    return this.svc.create(req.user.companyId, req.user.sub ?? req.user.id, body);
  }

  @Patch(":id/approve")
  approve(@Req() req: any, @Param("id") id: string) {
    return this.svc.approve(req.user.companyId, req.user.sub ?? req.user.id, id);
  }

  @Patch(":id/reject")
  reject(@Req() req: any, @Param("id") id: string) {
    return this.svc.reject(req.user.companyId, id);
  }
}
