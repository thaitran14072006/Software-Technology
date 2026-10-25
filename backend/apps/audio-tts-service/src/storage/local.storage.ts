import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { StorageDriver } from './storage.interface';

@Injectable()
export class LocalStorage implements StorageDriver {
  async save(key: string, data: Buffer): Promise<string> {
    const file = path.join(process.env.STORAGE_LOCAL_DIR ?? './storage', key);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, data);
    return `${process.env.PUBLIC_ASSET_BASE}/${key}`;
  }
}
