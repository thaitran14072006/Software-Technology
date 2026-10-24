import { BadRequestException, ValidationError, ValidationPipe } from '@nestjs/common';

function flatten(errors: ValidationError[], parent = ''): Record<string, string> {
  return errors.reduce((acc, e) => {
    const path = parent ? `${parent}.${e.property}` : e.property;
    if (e.constraints) acc[path] = Object.values(e.constraints)[0];
    if (e.children?.length) Object.assign(acc, flatten(e.children, path));
    return acc;
  }, {} as Record<string, string>);
}

// UC5-E2: trả { code: 'VALIDATION_FAILED', fields: { latitude: '...' } } để Admin UI tô đỏ đúng ô
export const appValidationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  exceptionFactory: (errors) => new BadRequestException({ code: 'VALIDATION_FAILED', fields: flatten(errors) }),
});
