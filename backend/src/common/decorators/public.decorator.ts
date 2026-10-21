/**
 * public.decorator.ts — ré-export canonique de @Public() (défini avec le JwtAuthGuard
 * pour garder la constante de métadonnée à un seul endroit).
 */
export { Public, IS_PUBLIC_KEY } from '../guards/jwt-auth.guard';
