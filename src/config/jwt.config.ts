import { toNumber } from '@app/core';
import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.APP_JWT_SECRET || 'b3CRK6de2je4x455d4m94d4ce8d4ldvX6m9sd',
  // milliseconds
  challenge_expires_in: toNumber(
    process.env.APP_JWT_CHALLENGE_EXPIRES_IN,
    1000 * 60 * 60,
  ), // Default: 1000 * 60 * 60 => 1 hour
  // milliseconds
  session_expires_in: toNumber(
    process.env.APP_JWT_SESSION_EXPIRES_IN,
    1000 * 60 * 60 * 24,
  ), // Default: 1000 * 60 * 60 * 24 => 1 day
  // milliseconds
  inactive_session_ttl: toNumber(
    process.env.APP_JWT_INACTIVE_SESSION_TTL,
    1000 * 60 * 60,
  ), // Default: 1000 * 60 * 60 => 1 hour
}));
