export type GameServerState = 'REGISTERED' | 'RESERVED' | 'DRAINING' | 'OFFLINE';
export declare function isGameServerTerminal(state: GameServerState): boolean;
export declare function allowedGameServerTransitions(from: GameServerState): readonly GameServerState[];
export declare function canGameServerTransition(from: GameServerState, to: GameServerState): boolean;
export declare function assertGameServerTransition(from: GameServerState, to: GameServerState): void;
