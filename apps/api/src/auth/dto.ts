import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, Length, Matches, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty()
  @Matches(/^[a-z0-9-]+$/)
  companySlug!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @MinLength(8)
  password!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Length(6, 6)
  mfaCode?: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;

  @IsString()
  companySlug!: string;
}
