import {BadRequestException,Injectable,PipeTransform} from '@nestjs/common';
/** PostgreSQL accepts the canonical legacy map UUID, which has no RFC version bits. */
@Injectable()
export class CanonicalUuidPipe implements PipeTransform {
 transform(value:unknown){if(typeof value!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value))throw new BadRequestException('UUID không hợp lệ.');return value;}
}
