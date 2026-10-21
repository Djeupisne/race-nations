import { divisionFromPl, type PlayerProfile, type PublicPlayerProfile } from '@race-nations/api-contracts';
import { PrismaService } from '../../prisma/prisma.service';
import { type Clock } from '../../common/utils/clock';
import type { LeaderboardQuery, SetNationalityInput, UpdatePlayerInput } from './players.dto';
export declare class PlayersService {
    private readonly prisma;
    private readonly clock;
    constructor(prisma: PrismaService, clock: Clock);
    getByPlayerId(playerId: string): Promise<{
        user: {
            role: import(".prisma/client").$Enums.UserRole;
        };
        wallet: {
            id: string;
            credits: number;
            gems: number;
            tokens: number;
            hardCents: number;
            createdAt: Date;
            updatedAt: Date;
            playerId: string | null;
            ownerType: import(".prisma/client").$Enums.OwnerType;
        } | null;
    } & {
        id: string;
        username: string;
        countryCode: string;
        nationality: string;
        marketingOptIn: boolean;
        birthDateConfirmed: boolean;
        userId: string;
        nationalityLocked: boolean;
        level: number;
        xp: number;
        plPoints: number;
        division: import(".prisma/client").$Enums.Division;
        reputation: number;
        createdAt: Date;
        preferredLanguage: string;
        chatGlobalEnabled: boolean;
        updatedAt: Date;
        ageVerifiedAt: Date | null;
        kycDocumentRef: string | null;
        acceptedTermsAt: Date | null;
        acceptedPrivacyAt: Date | null;
    }>;
    getProfileByUserId(userId: string): Promise<PlayerProfile>;
    getPublicProfile(playerId: string): Promise<PublicPlayerProfile>;
    updateProfile(userId: string, input: UpdatePlayerInput): Promise<PlayerProfile>;
    setNationality(userId: string, input: SetNationalityInput): Promise<PlayerProfile>;
    stats(playerId: string): Promise<{
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
    leaderboard(query: LeaderboardQuery): Promise<{
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
    lockNationalityIfNeeded(playerId: string): Promise<void>;
    applyPlDelta(playerId: string, delta: number): Promise<{
        plPoints: number;
        division: ReturnType<typeof divisionFromPl>;
    }>;
    private toProfile;
}
