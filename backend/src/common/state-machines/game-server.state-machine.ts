/**
 * Machine à états GameServer (INV-22) :
 *   REGISTERED → RESERVED → DRAINING → OFFLINE
 *
 * - REGISTERED : serveur upserté par le heartbeat de la fleet, éligible à l'allocation.
 * - RESERVED : verrouillé pour un match (allocation atomique dans matchmaking.worker).
 * - DRAINING : maintenance volontaire — finit ses matchs, n'accepte plus d'allocation.
 * - OFFLINE : perdu par heartbeat timeout ou arrêt déclaré ; retour possible en REGISTERED
 *   après re-registration (le serveur repart d'un cycle propre).
 */
import { InvalidStateTransitionError } from '../errors/domain-errors';

export type GameServerState = 'REGISTERED' | 'RESERVED' | 'DRAINING' | 'OFFLINE';

const GAME_SERVER_TRANSITIONS: Readonly<Record<GameServerState, readonly GameServerState[]>> = Object.freeze({
  REGISTERED: ['RESERVED', 'DRAINING', 'OFFLINE'],
  RESERVED: ['REGISTERED', 'DRAINING', 'OFFLINE'], // REGISTERED une fois le match libéré
  DRAINING: ['OFFLINE'],
  OFFLINE: ['REGISTERED'], // re-registration après redémarrage
});

export function isGameServerTerminal(state: GameServerState): boolean {
  return state === 'OFFLINE';
}

export function allowedGameServerTransitions(from: GameServerState): readonly GameServerState[] {
  return GAME_SERVER_TRANSITIONS[from];
}

export function canGameServerTransition(from: GameServerState, to: GameServerState): boolean {
  return GAME_SERVER_TRANSITIONS[from].includes(to);
}

export function assertGameServerTransition(from: GameServerState, to: GameServerState): void {
  if (!canGameServerTransition(from, to)) {
    throw new InvalidStateTransitionError('GameServer', from, to);
  }
}
