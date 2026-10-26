import 'reflect-metadata';
import {isCoordinateSource} from '@app/common/coordinate-source';
import {validate} from 'class-validator';
import {CreatePoiDto,PoiTranslationDto} from '../src/dto/v1/create-poi.dto';

test('document provenance passes POI validation without enabling field GPS', async()=>{
 const dto=Object.assign(new CreatePoiDto(),{code:'coord-test',mapId:'00000000-0000-0000-0000-000000000001',latitude:11.423924,longitude:107.427845,geoVerified:false,geoSourceUrl:`urn:sha256:${'a'.repeat(64)}#point-01`,translations:[Object.assign(new PoiTranslationDto(),{langCode:'vi',name:'Điểm theo tài liệu',scriptText:'Nội dung kiểm tra tọa độ.'})]});
 expect(await validate(dto)).toEqual([]);
 expect(dto.geoVerified).toBe(false);
 expect(isCoordinateSource('https://www.openstreetmap.org/node/5072875722')).toBe(true);
 for(const value of ['urn:sha256:short#point-01','javascript:alert(1)','file:///C:/secret','http://example.com',`urn:sha256:${'a'.repeat(64)}#other`,123])expect(isCoordinateSource(value)).toBe(false);
});
