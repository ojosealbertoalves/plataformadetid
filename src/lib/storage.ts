import { randomUUID } from "crypto";
import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";

export interface StoredFile {
  path: string;
  fileName: string;
  mime: string;
  size: number;
}

export interface StorageProvider {
  save(fileName: string, mime: string, buffer: Buffer): Promise<StoredFile>;
  read(storedPath: string): Promise<Buffer>;
}

/**
 * Salva anexos em disco local, em /uploads. Implementa a mesma interface
 * `StorageProvider` que uma implementação S3 usaria no deploy — basta trocar
 * a instância exportada abaixo por uma `S3StorageProvider` quando necessário.
 */
class LocalStorageProvider implements StorageProvider {
  private readonly root = path.join(process.cwd(), "uploads");

  async save(fileName: string, mime: string, buffer: Buffer): Promise<StoredFile> {
    await mkdir(this.root, { recursive: true });
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storedName = `${randomUUID()}-${safeName}`;
    const fullPath = path.join(this.root, storedName);
    await writeFile(fullPath, buffer);
    return { path: storedName, fileName, mime, size: buffer.length };
  }

  async read(storedPath: string): Promise<Buffer> {
    const safe = path.basename(storedPath);
    return readFile(path.join(this.root, safe));
  }
}

export const storageProvider: StorageProvider = new LocalStorageProvider();
