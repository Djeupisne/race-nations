/**
 * ws-jwt.helper — vérification du JWT au handshake WebSocket.
 * Le token transite par la query string ?access_token= (clients Steam/Unity
 * sans headers custom). On exige : signature HS256, iss/aud conformes, exp
 * non dépassé, et typ != 'refresh'. Échec = null → close code 4401.
 */
import { verify as jwtVerify } from 'jsonwebtoken';
import type { AuthenticatedUser } from '../modules/auth/auth.dto';

export const WS_UNAUTHORIZED_CLOSE_CODE = 4401;

const ISS = 'race-nations-api';
const AUD = 'race-nations-clients';

export function verifyWsToken(secret: string, token: string | undefined): AuthenticatedUser | null {
  if (!token || token.length > 4096) return null;
  try {
    const claims = jwtVerify(token, secret, {
      algorithms: ['HS256'],
      issuer: ISS,
      audience: AUD,
    }) as Record<string, unknown> & { sub?: string; typ?: string };
    // Les refresh tokens ne donnent JAMAIS accès au WS.
    if (claims.typ === 'refresh' || typeof claims.sub !== 'string') return null;
    return { userId: claims.sub, playerId: String(claims.playerId ?? ''), role: String(claims.role ?? 'player') };
  } catch {
    return null;
  }
}
