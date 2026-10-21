// Race Nations — Client HTTP des paris (miroir betting.controller.ts, préfixe /v1/betting)
using System;
using RaceNations.Betting.Dtos;
using RaceNations.Network;

namespace RaceNations.Betting
{
    /// <summary>
    /// Wrapper typé au-dessus de ApiClient (UnityWebRequest + Newtonsoft).
    /// Toutes les écritures passent par une clé d'idempotence (INV-07 : jamais de double-débit).
    /// </summary>
    public class BettingApi
    {
        private const string Base = "/v1/betting";
        private readonly ApiClient _client;

        public BettingApi(ApiClient client = null)
        {
            _client = client ?? ApiClient.Instance;
            if (_client == null)
                throw new InvalidOperationException("ApiClient non initialisé : appelez GameBootstrap d'abord.");
        }

        // ---- Lecture ----
        public void ListMarkets(string status, int limit, Action<ApiResult<MarketListDto>> onDone)
        {
            var path = $"{Base}/markets?limit={limit}";
            if (!string.IsNullOrEmpty(status)) path += $"&status={Uri.EscapeDataString(status)}";
            _client.GetAsync(path, onDone);
        }

        public void GetMarket(string marketId, Action<ApiResult<MarketDto>> onDone) =>
            _client.GetAsync($"{Base}/markets/{marketId}", onDone);

        public void GetOdds(string marketId, Action<ApiResult<OddsDto>> onDone) =>
            _client.GetAsync($"{Base}/markets/{marketId}/odds", onDone);

        public void MyBets(Action<ApiResult<System.Collections.Generic.List<BetDto>>> onDone) =>
            _client.GetAsync($"{Base}/me", onDone);

        public void GetLimits(Action<ApiResult<LimitsUsageDto>> onDone) =>
            _client.GetAsync($"{Base}/limits", onDone);

        // ---- Écriture (idempotent) ----
        public void CreateMarket(CreateMarketRequest req, string idemKey, Action<ApiResult<MarketDto>> onDone) =>
            _client.PostAsync($"{Base}/markets", req, idemKey, onDone);

        public void JoinMarket(string marketId, string idemKey, Action<ApiResult<MarketDto>> onDone) =>
            _client.PostAsync($"{Base}/markets/{marketId}/join", new JoinMarketRequest(), idemKey, onDone);

        public void CancelMarket(string marketId, string idemKey, Action<ApiResult<MarketDto>> onDone) =>
            _client.PostAsync($"{Base}/markets/{marketId}/cancel", new { }, idemKey, onDone);

        public void Dispute(string marketId, DisputeRequest req, string idemKey, Action<ApiResult<MarketDto>> onDone) =>
            _client.PostAsync($"{Base}/markets/{marketId}/dispute", req, idemKey, onDone);

        /// <summary>Résolution admin : REFUND_ALL ou UPHELD.</summary>
        public void ResolveDispute(string marketId, string outcome, string idemKey, Action<ApiResult<MarketDto>> onDone) =>
            _client.PostAsync($"{Base}/markets/{marketId}/dispute/resolve", new { outcome }, idemKey, onDone);

        /// <summary>Clôture manuelle (admin) : winningSide 0/1 ou push=true pour remboursement total.</summary>
        public void ManualSettle(string marketId, int? winningSide, bool push, string idemKey,
                                Action<ApiResult<SettleResultDto>> onDone) =>
            _client.PostAsync($"{Base}/markets/{marketId}/settle",
                new ManualSettleRequest { WinningSide = winningSide, Push = push }, idemKey, onDone);

        public static string NewIdemKey(string scope) =>
            $"{scope}:{Guid.NewGuid():N}";
    }
}
