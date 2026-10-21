/**
 * StaticPoolProvider — allocateur pour dev/staging : les game servers
 * s'enregistrent eux-mêmes (register) dans la table GameServer et sont
 * alloués par GameserversService.allocate(). Ici, pas de provisioning
 * infra : allocate/release sont des no-ops qui lisent l'état déjà en base.
 * Sélectionné quand AGONES_ENABLED != 'true'.
 */
import { Injectable } from '@nestjs/common';
import type { AllocationRequest, AllocationResult, IGameServerAllocator } from './allocator.interface';

@Injectable()
export class StaticPoolProvider implements IGameServerAllocator {
  async allocate(_req: AllocationRequest): Promise<AllocationResult> {
    // L'allocation réelle est faite par un UPDATE conditionnel sur la table
    // GameServer (anti double-attribution). Ce provider n'existe que pour
    // homogénéiser l'interface ; renvoie une erreur explicite si appelé.
    throw new Error('StaticPoolProvider.allocate is unused: allocation happens in GameserversService.allocate()');
  }

  async release(_infraId: string): Promise<void> {
    // No-op : libération = heartbeat/count décrémenté côté service.
  }
}
