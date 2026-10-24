import { Body, Controller, Get, Post, Req, UnauthorizedException, UseGuards, HttpException } from '@nestjs/common';
import { IsEmail, IsString, Length, MaxLength } from 'class-validator';
import { DataSource } from 'typeorm';
import { createHash, randomBytes,randomUUID } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { JwtAuthGuard } from '@app/common';
import { verifyPassword } from './password';

class LoginDto { @IsEmail() @MaxLength(255) email: string; @IsString() @Length(1,256) password: string; }
class RefreshDto { @IsString() @Length(64,64) refreshToken: string; }
const hash = (s: string) => createHash('sha256').update(s).digest('hex');
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  private attempts = new Map<string, { n: number; until: number }>();
  constructor(private ds: DataSource) {}
  private async issue(m: any, user: any) {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new UnauthorizedException();
    const refreshToken = randomBytes(32).toString('hex'),sid=randomUUID();
    await m.query("INSERT INTO refresh_tokens(id,user_id,token_hash,expires_at) VALUES ($1,$2,$3,now()+interval '7 days')", [sid,user.id, hash(refreshToken)]);
    return { accessToken: jwt.sign({ sub: user.id, role: user.role,sid }, secret, { algorithm: 'HS256', expiresIn: '15m' }), refreshToken, expiresIn: 900, user: { id:user.id,email:user.email,fullName:user.full_name,role:user.role } };
  }
  @Post('login') async login(@Body() body: LoginDto, @Req() req: any) {
    const now = Date.now(), key = req.ip;
    for (const [k,v] of this.attempts) if (v.until < now) this.attempts.delete(k);
    const a = this.attempts.get(key) ?? { n:0, until:now+60000 };
    if (++a.n > 10) { this.attempts.set(key,a); throw new HttpException('Thử lại sau một phút.',429); }
    this.attempts.set(key,a);
    const [user] = await this.ds.query('SELECT * FROM users WHERE lower(email)=lower($1)', [body.email]);
    if (!user?.is_active || user.role!=='ADMIN' || !await verifyPassword(body.password,user.password_hash)) throw new UnauthorizedException('Email hoặc mật khẩu không đúng.');
    return this.ds.transaction(async m => { await m.query('UPDATE users SET last_login_at=now() WHERE id=$1',[user.id]); return this.issue(m,user); });
  }
  @Post('refresh') async refresh(@Body() body: RefreshDto) {
    return this.ds.transaction(async m => {
      const [row] = await m.query("SELECT r.id AS token_id, u.* FROM refresh_tokens r JOIN users u ON u.id=r.user_id WHERE r.token_hash=$1 AND r.revoked_at IS NULL AND r.expires_at>now() AND u.is_active AND u.role='ADMIN' FOR UPDATE OF r",[hash(body.refreshToken)]);
      if (!row) throw new UnauthorizedException();
      await m.query('UPDATE refresh_tokens SET revoked_at=now() WHERE id=$1',[row.token_id]);
      return this.issue(m,row);
    });
  }
  @Post('logout') async logout(@Body() body: RefreshDto) {
    await this.ds.query('UPDATE refresh_tokens SET revoked_at=now() WHERE token_hash=$1 AND revoked_at IS NULL',[hash(body.refreshToken)]);
    return { ok:true };
  }
  @Get('me') @UseGuards(JwtAuthGuard) me(@Req() req: any) { return req.user; }
}
