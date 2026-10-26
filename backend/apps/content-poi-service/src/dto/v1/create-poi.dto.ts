import { ArrayMinSize, ArrayMaxSize, IsBoolean, IsEnum, IsIn, IsInt, IsLatitude, IsLongitude, IsNumber, IsOptional, IsString, IsUUID, IsUrl, Matches, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ValidateBy } from 'class-validator';
import { isCoordinateSource } from '@app/common/coordinate-source';

export class PoiTranslationDto {
  @IsIn(['vi','en','ja','zh','ko']) langCode: string;
  @IsString() @Matches(/\S/) @MaxLength(200) name: string;
  @IsOptional() @IsString() @MaxLength(500) summary?: string;
  @IsString() @Matches(/\S/) @MaxLength(30000) scriptText: string;
}

export class CreatePoiDto {
  @IsString() @Matches(/^[A-Za-z0-9_-]+$/) @MaxLength(20) code: string;
  // The existing seed uses a canonical PostgreSQL UUID without RFC version bits.
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) mapId: string;
  @IsOptional() @IsUUID() floorId?: string;
  @IsOptional() @IsInt() categoryId?: number;

  @IsLatitude({ message: 'Tọa độ GPS (latitude) bắt buộc và hợp lệ' }) latitude: number;
  @IsLongitude({ message: 'Tọa độ GPS (longitude) bắt buộc và hợp lệ' }) longitude: number;
  @IsOptional() @IsBoolean() geoVerified?: boolean;
  @IsOptional() @ValidateBy({name:'coordinateSource',validator:{validate:isCoordinateSource,defaultMessage:()=> 'Coordinate source must be HTTPS or a document SHA-256 reference.'}}) @MaxLength(2000) geoSourceUrl?: string;

  @IsOptional() @IsNumber() schematicX?: number;
  @IsOptional() @IsNumber() schematicY?: number;
  @IsOptional() @IsInt() @Min(3) @Max(200) triggerRadiusM?: number;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsEnum(['DRAFT', 'PUBLISHED']) status?: 'DRAFT' | 'PUBLISHED';

  /** DEVICE mode defaults to UPLOAD. MP3 files are attached using the protected upload endpoint. */
  @IsOptional() @IsIn(['TTS', 'UPLOAD']) audioMode?: 'TTS' | 'UPLOAD';
  @IsOptional() @IsIn(['MALE', 'FEMALE']) voiceGender?: 'MALE' | 'FEMALE';

  @ValidateNested({ each: true }) @Type(() => PoiTranslationDto) @ArrayMinSize(1) @ArrayMaxSize(5) translations: PoiTranslationDto[];
}
