import { PlayersService } from './players.service';
import { type LeaderboardQuery, type PlayerRecordsQuery, type SetNationalityInput, type UpdatePlayerInput } from './players.dto';
import type { AuthenticatedUser } from '../auth/auth.dto';
export declare class PlayersController {
    private readonly players;
    constructor(players: PlayersService);
    me(user: AuthenticatedUser): Promise<{
        id: string;
        username: string;
        countryCode: string;
        nationality: string;
        role: "PLAYER" | "MODERATOR" | "ADMIN" | "SYSTEM";
        ageVerified: boolean;
        nationalityLocked: boolean;
        level: number;
        xp: number;
        plPoints: number;
        division: "BRONZE" | "ARGENT" | "OR" | "PLATINE" | "DIAMANT" | "MAITRE" | "LEGEND";
        reputation: number;
        createdAt: string;
    }>;
    updateMe(user: AuthenticatedUser, input: UpdatePlayerInput): Promise<{
        id: string;
        username: string;
        countryCode: string;
        nationality: string;
        role: "PLAYER" | "MODERATOR" | "ADMIN" | "SYSTEM";
        ageVerified: boolean;
        nationalityLocked: boolean;
        level: number;
        xp: number;
        plPoints: number;
        division: "BRONZE" | "ARGENT" | "OR" | "PLATINE" | "DIAMANT" | "MAITRE" | "LEGEND";
        reputation: number;
        createdAt: string;
    }>;
    setNationality(user: AuthenticatedUser, input: SetNationalityInput): Promise<{
        id: string;
        username: string;
        countryCode: string;
        nationality: string;
        role: "PLAYER" | "MODERATOR" | "ADMIN" | "SYSTEM";
        ageVerified: boolean;
        nationalityLocked: boolean;
        level: number;
        xp: number;
        plPoints: number;
        division: "BRONZE" | "ARGENT" | "OR" | "PLATINE" | "DIAMANT" | "MAITRE" | "LEGEND";
        reputation: number;
        createdAt: string;
    }>;
    stats(user: AuthenticatedUser): Promise<{
        racesPlayed: number;
        victories: number;
        defeats: number;
        draws: number;
        abandons: number;
        winStreakCurrent: number;
        winStreakBest: number;
        totalDriftPoints: number;
        perfectRaces: number;
        recordsHeld: number;
        betsWon: number;
        betsLost: number;
    }>;
    records(user: AuthenticatedUser, query: PlayerRecordsQuery): Promise<{
        trackFilter: string | null;
        season: number | null;
        racesPlayed: number;
        victories: number;
        defeats: number;
        draws: number;
        abandons: number;
        winStreakCurrent: number;
        winStreakBest: number;
        totalDriftPoints: number;
        perfectRaces: number;
        recordsHeld: number;
        betsWon: number;
        betsLost: number;
        playerId: string;
    }>;
    publicProfile(id: string): Promise<{
        id: string;
        username: string;
        nationality: string;
        level: number;
        plPoints: number;
        division: "BRONZE" | "ARGENT" | "OR" | "PLATINE" | "DIAMANT" | "MAITRE" | "LEGEND";
    }>;
}
export declare class LeaderboardsController {
    private readonly players;
    constructor(players: PlayersService);
    list(query: LeaderboardQuery): Promise<{
        items: {
            rank: number;
            playerId: string;
            username: string;
            nationality: string;
            division: import(".prisma/client").$Enums.Division;
            plPoints: number;
            metric: number;
        }[];
        nextCursor: string | null;
    }>;
}
