import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
@Injectable()
export class RevService {
  constructor(private readonly ds: DataSource) {}
  async current(): Promise<number> { const [r] = await this.ds.query('SELECT rev FROM content_clock WHERE id=1'); return Number(r.rev); }
}
