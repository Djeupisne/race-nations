/**
 * GameServerAllocator — abstraction du provisionnement de serveurs de match
 * (docs/architecture.md §7). Deux implémentations : StaticPoolProvider
 * (dev/staging, pool fixe) et AgonesProvider (prod, Fleet Agones/K8s).
 * L'attribution elle-même reste en base (UPDATE conditionnel, INV-26) ;
 * l'allocateur ne fait que préparer/rendre la capacité.
 */
export interface AllocationRequest {
  matchId: string;
  region: string;
  maxPlayers: number;
}

export interface AllocationResult {
  /** Endpoint client : host:port ou adresse Agones. */
  address: string;
  /** Port UDP public du serveur de match. */
  port: number;
  /** Jeton court-lived remis au serveur pour authentifier le match. */
  serverToken: string;
  /** Identifiant infra (nom de Fleet GameServer Agones, etc.). */
  infraId: string;
}

export const GAME_SERVER_ALLOCATOR = 'GAME_SERVER_ALLOCATOR';

export interface IGameServerAllocator {
  allocate(req: AllocationRequest): Promise<AllocationResult>;
  release(infraId: string): Promise<void>;
}
