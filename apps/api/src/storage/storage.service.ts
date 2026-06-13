import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class StorageService {
  constructor(private readonly config: ConfigService, private readonly prisma: PrismaService) {}

  async save(companyId: string, kind: string, fileName: string, mimeType: string, buffer: Buffer, employeeId?: string) {
    const root = this.config.get<string>("STORAGE_ROOT", "./storage");
    const key = join(companyId, kind, `${Date.now()}-${fileName}`);
    const fullPath = join(root, key);
    await mkdir(join(root, companyId, kind), { recursive: true });
    await writeFile(fullPath, buffer);
    return this.prisma.fileObject.create({
      data: {
        companyId,
        employeeId,
        kind,
        fileName,
        mimeType,
        storageKey: key,
        sizeBytes: buffer.byteLength,
        checksum: createHash("sha256").update(buffer).digest("hex"),
      },
    });
  }
}
