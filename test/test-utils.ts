import path from 'path';
import { promises as fs } from 'fs';
export { strict as assert } from 'assert';

// export * from '../lib/utils.js';

// calc tmp dir by jest test file name
export function getTempDir(...p) {
  // `expect` is auto inject by @jest/globals
  const testPath = expect.getState().testPath;
  const testDir = path.join(process.cwd(), 'test');
  const relativePath = testPath.substring(testDir.length + 1, testPath.lastIndexOf('.test.ts'));
  const tmpDir = relativePath.split(path.sep).join('-');
  const tmpDirFullPath = path.join(testDir, '../.tmp', tmpDir, ...p);
  return tmpDirFullPath;
}

export async function initDir(p) {
  await fs.rm(p, { force: true, recursive: true });
  await fs.mkdir(p, { recursive: true });
}
