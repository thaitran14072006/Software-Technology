import { CanActivate, ExecutionContext, Injectable, SetMetadata, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { DataSource } from 'typeorm';

export type Role = 'ADMIN' | 'EDITOR';
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Xác thực JWT HS256 (Authorization: Bearer <token>), payload: { sub, role }.
 * Visitors remain anonymous. Admin sessions are issued by auth/login; dev-token.js is local tooling only.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly ds: DataSource) {}
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const h: string = req.headers['authorization'] ?? '';
    if (!h.startsWith('Bearer ')) throw new UnauthorizedException();
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new UnauthorizedException('JWT_SECRET chưa được cấu hình');
    try {
      const payload = jwt.verify(h.slice(7), secret, { algorithms: ['HS256'] }) as jwt.JwtPayload;
      if (typeof payload.sub !== 'string' || !/^[a-f0-9-]{36}$/i.test(payload.sub)) throw new Error();
      const [user] = await this.ds.query('SELECT id,email,full_name,role,is_active FROM users WHERE id=$1',[payload.sub]);
      if (!user?.is_active) throw new Error();
      if(payload.sid){
        const [session]=await this.ds.query('SELECT id FROM refresh_tokens WHERE id=$1 AND user_id=$2 AND revoked_at IS NULL AND expires_at>now()',[payload.sid,user.id]);
        if(!session)throw new Error();
      }
      req.user = { sub:user.id, email:user.email, fullName:user.full_name, role:['ADMIN','EDITOR'].includes(payload.role) ? user.role : payload.role };
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(ctx: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (!roles?.length) return true;
    const user = ctx.switchToHttp().getRequest().user;
    if (!user || !roles.includes(user.role)) throw new ForbiddenException();
    return true;
  }
}
