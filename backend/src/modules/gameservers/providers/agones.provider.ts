/**
 * AgonesProvider — allocateur prod via l'API Kubernetes/Agones (Fleet).
 * allocate() : demande un GameServer prêt dans la Fleet régionale puis
 * récupère son address/port. release() : shutdown du GameServer.
 * Désactivé tant que AGONES_ENABLED != true (staging utilise static pool).
 * Timeout court + échec = pas de retry infini (le worker réessaiera au
 * tick suivant ; aucun double-match possible grâce à l'UPDATE conditionnel).
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import type { AllocationRequest, AllocationResult, IGameServerAllocator } from './allocator.interface';

const AGONES_NS = 'agones-system';
const API_TIMEOUT_MS = 4_000;

@Injectable()
export class AgonesProvider implements IGameServerAllocator {
  private readonly logger = new Logger(AgonesProvider.name);

  constructor(private readonly config: ConfigService) {}

  async allocate(req: AllocationRequest): Promise<AllocationResult> {
    const api = this.config.get<string>('gameservers.agonesApiUrl');
    const token = this.config.get<string>('gameservers.agonesToken');
    if (!api || !token) throw new Error('Agones not configured');

    const fleet = `race-nations-${req.region.toLowerCase()}`;
    const url = `${api}/apis/agones.dev/v1/namespaces/${AGONES_NS}/gameservers?labelSelector=matchmaker.io%2Fpool%3D${fleet}&fieldSelector=status.state%3DReady`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });
    if (!res.ok) {
      this.logger.warn(`Agones list failed status=${res.status} region=${req.region}`);
      throw new Error('No capacity available');
    }
    const body = (await res.json()) as {
      items: Array<{ metadata: { name: string }; status: { address: string; ports: Array<{ port: number }> } }>;
    };
    const gs = body.items?.[0];
    if (!gs) throw new Error('No Ready GameServer in fleet');

    return {
      address: gs.status.address,
      port: gs.status.ports[0]?.port ?? 7777,
      serverToken: randomBytes(24).toString('hex'),
      infraId: gs.metadata.name,
    };
  }

  async release(infraId: string): Promise<void> {
    const api = this.config.get<string>('gameservers.agonesApiUrl');
    const token = this.config.get<string>('gameservers.agonesToken');
    if (!api || !token) return;
    try {
      await fetch(
        `${api}/apis/agones.dev/v1/namespaces/${AGONES_NS}/gameservers/${infraId}/shutdown`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(API_TIMEOUT_MS) },
      );
    } catch (err) {
      // Best-effort : un shutdown raté sera corrigé par le scaler Agones.
      this.logger.warn(`Agones shutdown failed id=${infraId}`);
    }
  }
}
