// Race Nations — Orchestrateur UI/logique des paris (mono-comportement, singleton service)
using System;
using System.Collections.Generic;
using RaceNations.Betting.Dtos;
using RaceNations.Core;
using RaceNations.Network;
using UnityEngine;

namespace RaceNations.Betting
{
    public enum BettingPhase { Idle, Browsing, Creating, InBet, Settled }

    /// <summary>
    /// Gère le cycle de vie d'un pari côté client : liste des marchés, cotes live,
    /// création/join avec clé d'idempotence persistée (anti double-débit, INV-07),
    /// et rafraîchissement périodique des cotes.
    /// </summary>
    public class BettingManager : MonoBehaviour
    {
        public static BettingManager Instance { get; private set; }

        [Header("Config")]
        [SerializeField] private float oddsRefreshSeconds = 5f;
        [SerializeField] private int listLimit = 20;

        private BettingApi _api;
        private readonly Dictionary<string, string> _idemKeys = new(); // marketId -> clé réutilisée

        public BettingPhase Phase { get; private set; } = BettingPhase.Idle;
        public event Action<List<MarketDto>> OnMarketsListed;
        public event Action<OddsDto> OnOddsUpdated;
        public event Action<MarketDto> OnMarketChanged;
        public event Action<string> OnError; // message lisible

        private MarketDto _current;
        private Coroutine _refreshRoutine;

        private void Awake()
        {
            if (Instance && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            _api = new BettingApi();
        }

        private void OnDestroy() { if (Instance == this) Instance = null; }

        // ---- API publique ----
        public void RefreshMarkets(string status = BetMarketStatus.Open) =>
            _api.ListMarkets(status, listLimit, r =>
            {
                if (r.Success) OnMarketsListed?.Invoke(r.Data.Items);
                else Fail(r);
            });

        public void OpenMarket(string marketId)
        {
            _api.GetMarket(marketId, r =>
            {
                if (!r.Success) { Fail(r); return; }
                _current = r.Data;
                Phase = BettingPhase.InBet;
                OnMarketChanged?.Invoke(_current);
                StartOddsRefresh(marketId);
            });
        }

        /// <summary>Crée un marché 1v1. La clé d'idempotence est mémorisée pour retry sans double-débit.</summary>
        public void CreateMarket(string trackId, long stake, string currency, Action<MarketDto> onCreated)
        {
            var key = GetOrCreateIdemKey($"create:{trackId}:{stake}");
            _api.CreateMarket(new CreateMarketRequest
            {
                TrackId = trackId,
                Stake = stake,
                Currency = currency,
            }, key, r =>
            {
                if (r.Success) { _current = r.Data; Phase = BettingPhase.Creating; onCreated?.Invoke(r.Data); }
                else Fail(r);
            });
        }

        public void Join(string marketId, Action<MarketDto> onJoined)
        {
            var key = GetOrCreateIdemKey($"join:{marketId}");
            _api.JoinMarket(marketId, key, r =>
            {
                if (r.Success) { _current = r.Data; OnMarketChanged?.Invoke(r.Data); onJoined?.Invoke(r.Data); }
                else Fail(r);
            });
        }

        public void Cancel(string marketId, Action<MarketDto> onCancelled)
        {
            var key = GetOrCreateIdemKey($"cancel:{marketId}");
            _api.CancelMarket(marketId, key, r =>
            {
                if (r.Success) { StopOddsRefresh(); Phase = BettingPhase.Idle; onCancelled?.Invoke(r.Data); }
                else Fail(r);
            });
        }

        public void Dispute(string marketId, string reason)
        {
            var key = GetOrCreateIdemKey($"dispute:{marketId}");
            _api.Dispute(marketId, new DisputeRequest { Reason = reason }, key, r =>
            {
                if (r.Success) OnMarketChanged?.Invoke(r.Data);
                else Fail(r);
            });
        }

        // ---- Internes ----
        private string GetOrCreateIdemKey(string scope)
        {
            if (!_idemKeys.TryGetValue(scope, out var k))
            {
                k = BettingApi.NewIdemKey(scope);
                _idemKeys[scope] = k;
            }
            return k;
        }

        private void StartOddsRefresh(string marketId)
        {
            StopOddsRefresh();
            _refreshRoutine = StartCoroutine(RefreshLoop(marketId));
        }

        private void StopOddsRefresh()
        {
            if (_refreshRoutine != null) { StopCoroutine(_refreshRoutine); _refreshRoutine = null; }
        }

        private System.Collections.IEnumerator RefreshLoop(string marketId)
        {
            var wait = new WaitForSeconds(Mathf.Max(1f, oddsRefreshSeconds));
            while (true)
            {
                _api.GetOdds(marketId, r => { if (r.Success) OnOddsUpdated?.Invoke(r.Data); });
                yield return wait;
            }
        }

        private void Fail<T>(ApiResult<T> r)
        {
            var msg = r.ErrorMessage ?? r.ErrorCode ?? $"HTTP {r.StatusCode}";
            Log.Warn("Betting", $"Échec API: {msg}");
            OnError?.Invoke(msg);
        }
    }
}
