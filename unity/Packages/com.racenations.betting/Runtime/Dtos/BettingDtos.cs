// Race Nations — DTOs de paris (parimutuel / marché 1v1)
// Miroir TypeScript : backend/src/modules/betting/betting.dto.ts + shared/api-contracts
using System;
using System.Collections.Generic;
using Newtonsoft.Json;

namespace RaceNations.Betting.Dtos
{
    // ---- Statuts (docs/betting.md §1, machine à états BetMarket) ----
    public static class BetMarketStatus
    {
        public const string Open = "OPEN";
        public const string Challenged = "CHALLENGED";
        public const string Locked = "LOCKED";
        public const string Settling = "SETTLING";
        public const string Settled = "SETTLED";
        public const string Cancelled = "CANCELLED";
        public const string Disputed = "DISPUTED";
    }

    public static class BetStatus
    {
        public const string Pending = "PENDING";
        public const string Escrowed = "ESCROWED";
        public const string Running = "RUNNING";
        public const string Won = "WON";
        public const string Lost = "LOST";
        public const string Refunded = "REFUNDED";
        public const string Void = "VOID";
    }

    public static class Currency
    {
        public const string Coins = "COINS";
        public const string Gems = "GEMS";
    }

    // ---- Réponses ----
    [JsonObject(MemberSerialization.OptIn)]
    public class MarketDto
    {
        [JsonProperty("id")] public string Id;
        [JsonProperty("type")] public string Type;
        [JsonProperty("status")] public string Status;
        [JsonProperty("currency")] public string Currency;
        [JsonProperty("trackId")] public string TrackId;
        [JsonProperty("creatorId")] public string CreatorId;
        [JsonProperty("opponentId")] public string OpponentId;
        [JsonProperty("stake")] public long Stake;
        [JsonProperty("totalPool")] public long TotalPool;
        [JsonProperty("commissionBps")] public int CommissionBps;
        [JsonProperty("side0Stake")] public long Side0Stake;
        [JsonProperty("side1Stake")] public long Side1Stake;
        [JsonProperty("opensAt")] public DateTime OpensAt;
        [JsonProperty("closesAt")] public DateTime ClosesAt;
        [JsonProperty("settlesAt")] public DateTime? SettlesAt;
        [JsonProperty("winningSide")] public int? WinningSide;
        [JsonProperty("createdAt")] public DateTime CreatedAt;
    }

    [JsonObject(MemberSerialization.OptIn)]
    public class OddsDto
    {
        [JsonProperty("marketId")] public string MarketId;
        [JsonProperty("side0")] public SideOddsDto Side0;
        [JsonProperty("side1")] public SideOddsDto Side1;
        [JsonProperty("totalPool")] public long TotalPool;
        [JsonProperty("houseEdge")] public double HouseEdge;
        [JsonProperty("computedAt")] public DateTime ComputedAt;
    }

    [JsonObject(MemberSerialization.OptIn)]
    public class SideOddsDto
    {
        [JsonProperty("stake")] public long Stake;
        [JsonProperty("decimalOdds")] public double DecimalOdds;
        [JsonProperty("impliedProbability")] public double ImpliedProbability;
        [JsonProperty("payoutIfWins")] public long PayoutIfWins;
    }

    [JsonObject(MemberSerialization.OptIn)]
    public class BetDto
    {
        [JsonProperty("id")] public string Id;
        [JsonProperty("marketId")] public string MarketId;
        [JsonProperty("playerId")] public string PlayerId;
        [JsonProperty("side")] public int Side;
        [JsonProperty("amount")] public long Amount;
        [JsonProperty("status")] public string Status;
        [JsonProperty("result")] public string Result;
        [JsonProperty("payout")] public long? Payout;
        [JsonProperty("escrowTxId")] public string EscrowTxId;
        [JsonProperty("createdAt")] public DateTime CreatedAt;
    }

    [JsonObject(MemberSerialization.OptIn)]
    public class MarketListDto
    {
        [JsonProperty("items")] public List<MarketDto> Items = new();
        [JsonProperty("nextCursor")] public string NextCursor;
    }

    [JsonObject(MemberSerialization.OptIn)]
    public class LimitsUsageDto
    {
        [JsonProperty("dailyStaked")] public long DailyStaked;
        [JsonProperty("dailyLimit")] public long DailyLimit;
        [JsonProperty("openBets")] public int OpenBets;
        [JsonProperty("maxOpenBets")] public int MaxOpenBets;
        [JsonProperty("resetAt")] public DateTime ResetAt;
    }

    [JsonObject(MemberSerialization.OptIn)]
    public class SettleResultDto
    {
        [JsonProperty("marketId")] public string MarketId;
        [JsonProperty("status")] public string Status;
        [JsonProperty("winningSide")] public int? WinningSide;
        [JsonProperty("totalPool")] public long TotalPool;
        [JsonProperty("commission")] public long Commission;
        [JsonProperty("paidOut")] public long PaidOut;
        [JsonProperty("idempotent")] public bool Idempotent;
    }

    // ---- Requêtes ----
    [JsonObject(MemberSerialization.OptIn)]
    public class CreateMarketRequest
    {
        [JsonProperty("type")] public string Type = "HEAD_TO_HEAD";
        [JsonProperty("currency")] public string Currency = Currency.Coins;
        [JsonProperty("trackId")] public string TrackId;
        [JsonProperty("stake")] public long Stake;
        [JsonProperty("durationMinutes")] public int DurationMinutes = 30;
    }

    [JsonObject(MemberSerialization.OptIn)]
    public class JoinMarketRequest
    {
        // Le corps d'acceptation est validé côté serveur ; champ vide volontaire.
        [JsonProperty("acknowledgeRules")] public bool AcknowledgeRules = true;
    }

    [JsonObject(MemberSerialization.OptIn)]
    public class DisputeRequest
    {
        [JsonProperty("reason")] public string Reason;
        [JsonProperty("evidenceUrls")] public List<string> EvidenceUrls = new();
    }

    [JsonObject(MemberSerialization.OptIn)]
    public class ManualSettleRequest
    {
        [JsonProperty("winningSide")] public int? WinningSide;
        [JsonProperty("push")] public bool Push;
    }
}
