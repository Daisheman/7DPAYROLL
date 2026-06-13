import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export type AuthUser = {
  sub: string;
  companyId: string;
  email: string;
  roles: string[];
};

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser => {
  return ctx.switchToHttp().getRequest().user;
});
