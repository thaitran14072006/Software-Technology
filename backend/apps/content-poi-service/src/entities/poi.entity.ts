import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PoiTranslation } from './poi-translation.entity';
import { PoiAudio } from './poi-audio.entity';

export type PoiStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
const num = { to: (v: any) => v, from: (v: any) => (v == null ? null : +v) };

@Entity('pois')
@Index(['mapId', 'status'])
export class Poi {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ length: 20, unique: true }) code: string;
  @Column({ name: 'map_id', type: 'uuid' }) mapId: string;
  @Column({ name: 'floor_id', type: 'uuid', nullable: true }) floorId: string | null;
  @Column({ name: 'category_id', type: 'smallint', nullable: true }) categoryId: number | null;
  @Column('double precision') latitude: number;
  @Column('double precision') longitude: number;
  @Column({ name: 'geo_verified', type: 'boolean', default: false }) geoVerified: boolean;
  @Column({name:'geo_source_url',type:'text',nullable:true}) geoSourceUrl: string | null;
  @Column({ name: 'schematic_x', type: 'numeric', precision: 10, scale: 2, nullable: true, transformer: num }) schematicX: number | null;
  @Column({ name: 'schematic_y', type: 'numeric', precision: 10, scale: 2, nullable: true, transformer: num }) schematicY: number | null;
  @Column({ name: 'trigger_radius_m', type: 'smallint', nullable: true }) triggerRadiusM: number | null;
  @Column({ name: 'image_url', type: 'text', nullable: true }) imageUrl: string | null;
  @Column({ type: 'enum', enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], enumName: 'poi_status', default: 'DRAFT' }) status: PoiStatus;
  @Column({ name: 'sort_order', type: 'smallint', default: 0 }) sortOrder: number;
  @Column({ type: 'int', default: 1 }) version: number;
  @Column({ type: 'bigint', default: 0, transformer: { to: (v: any) => v, from: (v: any) => Number(v) } }) rev: number;
  @Column({ name: 'created_by', type: 'uuid', nullable: true }) createdBy: string | null;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
  @DeleteDateColumn({ name: 'deleted_at' }) deletedAt: Date | null;

  @OneToMany(() => PoiTranslation, (t) => t.poi) translations: PoiTranslation[];
  @OneToMany(() => PoiAudio, (a) => a.poi) audios: PoiAudio[];
}
