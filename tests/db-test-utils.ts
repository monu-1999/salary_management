import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export function createTempDbPath(prefix: string): string {
  return path.join(
    os.tmpdir(),
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}.db`,
  );
}

export function removeDbArtifacts(dbPath: string): void {
  [dbPath, `${dbPath}-shm`, `${dbPath}-wal`].forEach((filePath) => {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
}
