using System;
using System.Collections.Generic;
using System.Linq;
using RaceNations.Gameplay.Vehicles;
using UnityEngine;

namespace RaceNations.Gameplay.Race
{
    public enum RacePhase { Lobby, Countdown, Racing, Finished, Aborted }

    public enum CheckpointStatus { Pending, Passed, Skipped }

    /// <summary>Progrès d'un concurrent (joueur local, distant ou IA) dans la course.</summary>
    public class RacerProgress
    {
        public string RacerId;
        public int Lap;                       // tour courant (1-based)
        public int NextCheckpointIndex;       // checkpoint à valider ensuite
        public float TrackDistance;           // distance parcourue sur le circuit (classement)
        public CheckpointStatus[] Checkpoints;
        public bool Disqualified;             // triche détectée (checkpoint sauté de façon invérifiable)
        public TimeSpan? FinishTime;
        public float LastCheckpointStamp;     // Time.time au dernier passage (anti-rejeu)

        public int CompletedCheckpoints => Checkpoints.Count(c => c == CheckpointStatus.Passed);
    }

    /// <summary>
    /// Machine à états de la course côté client (miroir du serveur autoritaire —
    /// docs/backend/race-server.md). Responsabilités :
    ///  - phases : Lobby → Countdown (3-2-1-GO injecté par le serveur) → Racing → Finished,
    ///  - collecte des validations de checkpoints via CheckpointTracker → TryPassCheckpoint(),
    ///  - classement temps réel (lap, puis distance piste, puis ordre d'arrivée),
    ///  - pénalités (skip de checkpoint = revalidation obligatoire du précédent manquant),
    ///  - horloge de course monotone (Time.unscaledTime — jamais Time.time pour les chronos).
    /// Le réseau n'est PAS géré ici : RaceNetworkManager pousse les évènements serveur
    /// (ServerCountdown, ServerRaceStart, ServerFinish) vers cette machine à états.
    /// </summary>
    public class RaceManager : MonoBehaviour
    {
        public static RaceManager Instance { get; private set; }

        [Header("Réglages")]
        [SerializeField] private int totalLaps = 3;
        [SerializeField] private float countdownSeconds = 3f;

        public RacePhase Phase { get; private set; } = RacePhase.Lobby;
        public int TotalLaps => totalLaps;
        public event Action<RacePhase> OnPhaseChanged;
        public event Action OnRaceFinished;
        public event Action<RacerProgress> OnStandingsUpdated;

        private readonly List<Transform> _checkpoints = new();   // ordre piste, start/finish inclus en [0]
        private readonly Dictionary<string, RacerProgress> _progress = new();
        private readonly List<string> _finishOrder = new();
        private float _raceStartTime;
        private float _countdownEndsAt;

        public IReadOnlyList<RacerProgress> Standings => ComputeStandings();
        public float RaceElapsedSeconds => Phase == RacePhase.Racing ? Time.unscaledTime - _raceStartTime : 0f;

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
        }

        // ---------------------------------------------------------------- setup

        /// <summary>Injecté par la scène de course (TrackLoader) — l'ordre définit la piste.</summary>
        public void RegisterCheckpoints(IEnumerable<Transform> checkpoints)
        {
            _checkpoints.Clear();
            _checkpoints.AddRange(checkpoints);
        }

        public void RegisterRacer(string racerId)
        {
            if (_progress.ContainsKey(racerId)) return;
            _progress[racerId] = new RacerProgress
            {
                RacerId = racerId,
                Lap = 1,
                NextCheckpointIndex = 0,
                Checkpoints = new CheckpointStatus[_checkpoints.Count],
            };
            for (var i = 0; i < _progress[racerId].Checkpoints.Length; i++)
                _progress[racerId].Checkpoints[i] = CheckpointStatus.Pending;
        }

        // ---------------------------------------------------------------- phases

        public void StartCountdown()
        {
            if (Phase != RacePhase.Lobby) return;
            Phase = RacePhase.Countdown;
            _countdownEndsAt = Time.unscaledTime + countdownSeconds;
            OnPhaseChanged?.Invoke(Phase);
        }

        /// <summary>Appelé par RaceNetworkManager quand le serveur annonce GO (source de vérité).</summary>
        public void ServerForceStart(float serverTimestampOffset = 0f)
        {
            Phase = RacePhase.Racing;
            _raceStartTime = Time.unscaledTime + serverTimestampOffset;
            OnPhaseChanged?.Invoke(Phase);
        }

        public void AbortRace(string reason)
        {
            Log.Warn($"[RaceManager] course abandonnée : {reason}");
            SetPhase(RacePhase.Aborted);
        }

        private void Update()
        {
            if (Phase == RacePhase.Countdown && Time.unscaledTime >= _countdownEndsAt)
                ServerForceStart();
        }

        // ---------------------------------------------------------------- checkpoints

        /// <summary>
        /// Validation d'un checkpoint par un concurrent. Règles (parité serveur) :
        ///  - seul le prochain checkpoint attendu est valide (ordre strict),
        ///  - anti-rejeu : même checkpoint deux fois dans la même seconde ignorée,
        ///  - passer la ligne [0] alors que tous les autres sont validés = tour bouclé.
        /// Retourne false si invalide (le caller UI peut signaler un skip suspect).
        /// </summary>
        public bool TryPassCheckpoint(string racerId, int checkpointIndex)
        {
            if (Phase != RacePhase.Racing) return false;
            if (!_progress.TryGetValue(racerId, out var p)) return false;
            if (p.Disqualified || checkpointIndex < 0 || checkpointIndex >= _checkpoints.Count) return false;

            if (checkpointIndex != p.NextCheckpointIndex)
            {
                // Skip : on marque les intermédiaires manquants et on exige rattrapage.
                for (var i = p.NextCheckpointIndex; i < checkpointIndex; i++)
                    p.Checkpoints[i] = CheckpointStatus.Skipped;
                p.NextCheckpointIndex = checkpointIndex;
            }

            if (Time.unscaledTime - p.LastCheckpointStamp < 0.5f && p.Checkpoints[checkpointIndex] == CheckpointStatus.Passed)
                return false; // rejeu instantané (bounce sur le trigger)

            p.Checkpoints[checkpointIndex] = CheckpointStatus.Passed;
            p.LastCheckpointStamp = Time.unscaledTime;
            p.NextCheckpointIndex = (checkpointIndex + 1) % _checkpoints.Count;

            // Ligne start/finish validée en cycle complet → tour suivant.
            if (checkpointIndex == 0 && p.CompletedCheckpoints == _checkpoints.Count)
            {
                p.Lap++;
                for (var i = 0; i < p.Checkpoints.Length; i++)
                    if (i != 0) p.Checkpoints[i] = CheckpointStatus.Pending;
                if (p.Lap > totalLaps)
                    MarkFinished(racerId);
            }

            p.TrackDistance = ComputeTrackDistance(p);
            OnStandingsUpdated?.Invoke(p);
            return true;
        }

        private void MarkFinished(string racerId)
        {
            var p = _progress[racerId];
            p.FinishTime = TimeSpan.FromSeconds(Time.unscaledTime - _raceStartTime);
            _finishOrder.Add(racerId);

            if (_finishOrder.Count == _progress.Values.Count(x => !x.Disqualified))
            {
                SetPhase(RacePhase.Finished);
                OnRaceFinished?.Invoke();
            }
        }

        private float ComputeTrackDistance(RacerProgress p)
        {
            // Somme des distances entre checkpoints validés (approximation poly-ligne suffisante
            // pour le tie-break ; la valeur authoritative vient du serveur en mode classé).
            float total = 0f;
            for (var i = 1; i <= p.CompletedCheckpoints && i < _checkpoints.Count; i++)
                total += Vector3.Distance(_checkpoints[i - 1].position, _checkpoints[i].position);
            return total;
        }

        // ---------------------------------------------------------------- classement

        private List<RacerProgress> ComputeStandings()
        {
            return _progress.Values
                .Where(p => !p.Disqualified)
                .OrderByDescending(p => p.FinishTime.HasValue ? int.MaxValue - _finishOrder.IndexOf(p.RacerId) : 0)
                .ThenByDescending(p => p.Lap)
                .ThenByDescending(p => p.TrackDistance)
                .ToList();
        }

        public int PositionOf(string racerId)
        {
            var standings = ComputeStandings();
            var idx = standings.FindIndex(p => p.RacerId == racerId);
            return idx < 0 ? standings.Count + 1 : idx + 1;
        }

        private void SetPhase(RacePhase phase)
        {
            Phase = phase;
            OnPhaseChanged?.Invoke(phase);
        }
    }
}
