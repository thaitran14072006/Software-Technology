import {hashPassword,verifyPassword} from '../src/auth/password';
describe('Admin password hashing',()=>{
 it('uses independent salts and rejects the wrong password',async()=>{const a=await hashPassword('correct-password'),b=await hashPassword('correct-password');expect(a).not.toBe(b);expect(await verifyPassword('correct-password',a)).toBe(true);expect(await verifyPassword('wrong',a)).toBe(false);});
 it('does not accept the old development placeholder as a password hash',async()=>{expect(await verifyPassword('anything','DISABLED_DEV_TOKEN_ONLY')).toBe(false);});
});
