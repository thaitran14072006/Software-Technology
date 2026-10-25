export interface StorageDriver { save(key: string, data: Buffer, mime: string): Promise<string>; }
export const STORAGE = Symbol('STORAGE');
