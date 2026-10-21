export interface ParimutuelStake {
    playerId: string;
    stake: number;
}
export interface ParimutuelResult {
    totalPool: number;
    houseCut: number;
    netPool: number;
    totalPaidOut: number;
    residue: number;
    payouts: Array<{
        playerId: string;
        payout: number;
    }>;
}
export declare function computeParimutuelSettlement(stakes: readonly ParimutuelStake[], winningPlayerIds: ReadonlySet<string>, houseEdgeBps: number): ParimutuelResult;
export declare function computeOneVersusOne(stakeA: number, stakeB: number, winner: 'A' | 'B', houseEdgeBps: number): ParimutuelResult;
export declare function computePushRefund(stakes: readonly ParimutuelStake[]): ParimutuelResult;
export declare function assertConservation(result: ParimutuelResult, expectedDebits: number): void;
