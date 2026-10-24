import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('poi_qr_codes')
export class PoiQrCode {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'enum', enum: ['GATE', 'POI'], enumName: 'qr_kind' }) kind: 'GATE' | 'POI';
  @Column({ name: 'poi_id', type: 'uuid', nullable: true }) poiId: string | null;
  @Column({ length: 64, unique: true }) token: string;
  @Column({ name: 'target_url', type: 'text', nullable: true }) targetUrl: string | null;
  @Column({ name: 'is_active', default: true }) isActive: boolean;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}

@Entity('ble_beacons')
export class BleBeacon {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'poi_id', type: 'uuid' }) poiId: string;
  @Column({ type: 'uuid' }) uuid: string;
  @Column({ type: 'int' }) major: number;
  @Column({ type: 'int' }) minor: number;
  @Column({ name: 'tx_power', type: 'smallint', nullable: true }) txPower: number | null;
  @Column({ name: 'is_active', default: true }) isActive: boolean;
}
