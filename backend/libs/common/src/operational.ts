import { CallHandler, Catch, Controller, ExceptionFilter, ExecutionContext, Get, Injectable, NestInterceptor, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { mergeMap } from 'rxjs/operators';
@Controller('health')
export class HealthController {
 constructor(private ds:DataSource) {}
 @Get('live') live(){return {ok:true};}
 @Get('ready') async ready(){try{await this.ds.query('SELECT 1');await this.ds.query('SELECT rev FROM content_clock WHERE id=1');return {ok:true,database:true};}catch{throw new ServiceUnavailableException('Database hoặc migration chưa sẵn sàng.');}}
}
@Injectable()
export class AuditInterceptor implements NestInterceptor {
 constructor(private ds:DataSource) {}
 intercept(ctx:ExecutionContext,next:CallHandler){
   if(ctx.getType()!=='http')return next.handle();
   const req=ctx.switchToHttp().getRequest();
   if(!req.url.includes('/admin/')||['GET','HEAD'].includes(req.method))return next.handle();
   return next.handle().pipe(mergeMap(async value=>{
     await this.ds.query('INSERT INTO audit_logs(user_id,action,entity,entity_id,diff) VALUES ($1,$2,$3,$4,$5)',[req.user?.sub??null,req.method,'admin',req.params?.id??null,{path:req.path}]);return value;
   }));
 }
}
@Catch(require('typeorm').QueryFailedError)
export class DatabaseExceptionFilter implements ExceptionFilter {
 catch(error:any,host:any){const code=error.driverError?.code;const status=code==='23505'?409:['23503','23514','22P02','22001'].includes(code)?400:500;host.switchToHttp().getResponse().status(status).json({statusCode:status,message:status===409?'Dữ liệu đã tồn tại.':status===400?'Dữ liệu tham chiếu hoặc giá trị không hợp lệ.':'Không xử lý được dữ liệu.'});}
}
