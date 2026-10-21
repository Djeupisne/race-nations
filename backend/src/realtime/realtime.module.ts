/**
 * RealtimeModule — hub WebSocket applicatif (pub/sub Redis).
 * Global : BettingService, MatchmakingWorker, WalletService… publient via WsHub.
 */
import { Global, Module } from '@nestjs/common';
import { WsHubService } from './ws-hub.service';

@Global()
@Module({
  providers: [WsHubService],
  exports: [WsHubService],
})
export class RealtimeModule {}
