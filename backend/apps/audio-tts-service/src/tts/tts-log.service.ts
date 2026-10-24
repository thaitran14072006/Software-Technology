import { Injectable, Logger } from '@nestjs/common';
import { MongoClient } from 'mongodb';

export interface TtsCallLog { audioId: string; provider: string; chars: number; latencyMs: number; success: boolean; error?: string; }

/** Ghi tts_call_logs (chi phí/quota/lỗi). Có MONGO_URL thì ghi vào MongoDB, không thì chỉ ghi log. */
@Injectable()
export class TtsLogService {
  private readonly log = new Logger(TtsLogService.name);
  private client: MongoClient | null = null;

  async record(e: TtsCallLog) {
    this.log.log(`${e.success ? 'OK' : 'FAIL'} audio=${e.audioId} ${e.provider} chars=${e.chars} ${e.latencyMs}ms ${e.error ?? ''}`);
    if (!process.env.MONGO_URL) return;
    try {
      this.client ??= await new MongoClient(process.env.MONGO_URL).connect();
      await this.client.db().collection('tts_call_logs').insertOne({ ...e, ts: new Date() });
    } catch (err) { this.log.warn(`Không ghi được Mongo: ${(err as Error).message}`); }
  }
}
