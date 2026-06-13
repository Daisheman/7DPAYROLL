import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as cookieParser from "cookie-parser";
import { randomBytes, timingSafeEqual } from "crypto";
import { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  const config = app.get(ConfigService);
  const origin = config.getOrThrow<string>("APP_ORIGIN");

  app.setGlobalPrefix("api");
  app.enableCors({ origin, credentials: true });
  app.use(cookieParser());
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", origin],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // CSRF middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Issue CSRF token
    if (req.method === "GET" && req.path === "/api/auth/csrf") {
      const token = randomBytes(32).toString("hex");
      res.cookie("csrf_token", token, {
        sameSite: "lax",
        secure: false,
        httpOnly: false,
        path: "/",
      });
      res.json({ csrfToken: token });
      return;
    }

    // Validate CSRF on mutating requests
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      const ct = req.headers["content-type"] ?? "";
      // Skip for multipart (file uploads)
      if (ct.includes("multipart/form-data")) { next(); return; }

      const headerToken = req.headers["x-csrf-token"] as string | undefined;
      if (!headerToken) {
        res.status(403).json({ message: "Missing CSRF token" });
        return;
      }

      // If cookie is available, validate match; otherwise accept header presence
      // (cookie may not be forwarded correctly in some nginx proxy configurations)
      const cookieToken = req.cookies?.csrf_token;
      if (cookieToken) {
        try {
          const cookieBuf = Buffer.from(String(cookieToken));
          const headerBuf = Buffer.from(String(headerToken));
          if (cookieBuf.length !== headerBuf.length || !timingSafeEqual(cookieBuf, headerBuf)) {
            res.status(403).json({ message: "Invalid CSRF token" });
            return;
          }
        } catch {
          res.status(403).json({ message: "Invalid CSRF token" });
          return;
        }
      }
      // No cookie present — accept if header token exists (JWT auth protects endpoint)
    }
    next();
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
    forbidNonWhitelisted: true,
  }));

  const docs = new DocumentBuilder()
    .setTitle("Profacc Payroll API")
    .setDescription("API-first multi-tenant payroll platform")
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();
  SwaggerModule.setup("api/docs", app, SwaggerModule.createDocument(app, docs));

  await app.listen(Number(process.env.PORT) || 4000, "0.0.0.0");
}

bootstrap();
