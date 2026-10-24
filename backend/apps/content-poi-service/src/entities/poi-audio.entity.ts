import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Poi } from './poi.entity';
import { PoiTranslation } from './poi-translation.entity';

export type AudioStatus = 'PENDING' | 'READY' | 'FAILED';

@Entity('poi_audios')
@Unique(['translationId', 'voiceGender'])
export class PoiAudio {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({name:'current_job_id',type:'uuid',nullable:true}) currentJobId: string | null;
  @Column({ name: 'translation_id', type: 'uuid' }) translationId: string;
  @Column({ name: 'poi_id', type: 'uuid' }) poiId: string;
  @Column({ name: 'lang_code', length: 5 }) langCode: string;
  @Column({ name: 'voice_gender', type: 'enum', enum: ['MALE', 'FEMALE'], enumName: 'voice_gender', default: 'FEMALE' }) voiceGender: 'MALE' | 'FEMALE';
  @Column({ type: 'enum', enum: ['TTS', 'UPLOAD'], enumName: 'audio_source', default: 'TTS' }) source: 'TTS' | 'UPLOAD';
  @Column({ type: 'enum', enum: ['PENDING', 'READY', 'FAILED'], enumName: 'audio_status', default: 'PENDING' }) status: AudioStatus;
  @Column({ type: 'varchar', length: 20, nullable: true }) provider: string | null;
  @Column({ name: 'voice_name', type: 'varchar', length: 60, nullable: true }) voiceName: string | null;
  @Column({ name: 'audio_url', type: 'text', nullable: true }) audioUrl: string | null;
  @Column({ name: 'duration_sec', type: 'numeric', precision: 7, scale: 2, nullable: true }) durationSec: string | null;
  @Column({ name: 'size_bytes', type: 'int', nullable: true }) sizeBytes: number | null;
  @Column({ name: 'text_hash', type: 'char', length: 64, nullable: true }) textHash: string | null;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;

  @ManyToOne(() => Poi, (p) => p.audios, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'poi_id' }) poi: Poi;
  @ManyToOne(() => PoiTranslation, (t) => t.audios, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'translation_id' }) translation: PoiTranslation;
}
