import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Poi } from './poi.entity';
import { PoiAudio } from './poi-audio.entity';

@Entity('poi_translations')
@Unique(['poiId', 'langCode'])
export class PoiTranslation {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'poi_id', type: 'uuid' }) poiId: string;
  @Column({ name: 'lang_code', length: 5 }) langCode: string;
  @Column({ length: 200 }) name: string;
  @Column({ type: 'varchar', length: 500, nullable: true }) summary: string | null;
  @Column({ name: 'script_text', type: 'text' }) scriptText: string;
  @Column({ name: 'text_hash', type: 'char', length: 64 }) textHash: string;

  @ManyToOne(() => Poi, (p) => p.translations, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'poi_id' }) poi: Poi;
  @OneToMany(() => PoiAudio, (a) => a.translation) audios: PoiAudio[];
}
