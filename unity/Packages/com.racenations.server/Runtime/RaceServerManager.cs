// Race Nations — Autorité de course côté serveur (tick, snapshots, résultats signés)
using System;
using System.Collections.Generic;
using RaceNations.Core;
using RaceNations.RaceNet;
using UnityEngine;

namespace RaceNations.Server
{
    public enum ServerRacePhase { WaitingForPlayers, Countdown, Racing, Finishing, Reported, Closed }

    /// <summary>
    /// Détient l'autorité d'une session de course : reçoit les inputs clients,
    /// applique la simulation serveur (miroir VehicleController), diffuse des
    /// snapshots à tickRateHz, valide les checkpoints (ServerValidation), et
    /// produit un résultat signé transmis au backend (ServerResultReporter).
    /// Les paris liés au marché sont réglés par le backend — le serveur ne fait
    /// qu'émettre le verdict (INV-11 : source de vérité = serveur, pas le client).
    /// </summary>
    public class RaceServerManager : MonoBehaviour
    {
        private ServerConfig _config = ServerConfig.LoadOrDefault();
        private readonly Dictionary<string, ServerRacer> _racers = new();
        private float _accumulator;
        private int _tick;

        public ServerRacePhase Phase { get; private set; } = ServerRacePhase.WaitingForPlayers;
        public IReadOnlyDictionary<string, ServerRacer> Racers => _racers;
        public ServerValidation Validation { get; set; }
        public event Action<ServerRacePhase> OnPhaseChanged;

        public class ServerRacer
        {
            public string PlayerId;
            public Vector3 Position;
            public Quaternion Rotation;
            public float Speed;
            public int NextCheckpoint;
            public int Lap;
            public bool Finished;
            public double? FinishTimeUtc;
            public List<float> InputLog = new(); // throttle/steer agrégés pour audit
        }

        public void Configure(ServerConfig config)
        {
            _config = config ?? _config;
        }

        public void StartAccepting()
        {
            SetPhase(ServerRacePhase.WaitingForPlayers);
            Log.Info("RaceServer", $"En attente de joueurs (max={_config.MaxPlayers}, track={_config.TrackId})");
        }

        public bool TryAddRacer(string playerId, Vector3 spawnPosition)
        {
            if (_racers.Count >= _config.MaxPlayers) return false;
            if (_racers.ContainsKey(playerId)) return true; // idempotent sur reconnexion
            _racers[playerId] = new ServerRacer { PlayerId = playerId, Position = spawnPosition };
            return true;
        }

        public void ApplyInput(string playerId, float throttle, float steer)
        {
            if (!_racers.TryGetValue(playerId, out var r) || r.Finished) return;
            r.InputLog.Add(throttle);
            // Simulation simplifiée du véhicule serveur (détails complets dans VehicleController ;
            // ici uniquement l'intégration nécessaire aux snapshots & à la validation).
            const float accel = 18f, drag = 0.35f, maxSpeed = 62f, turn = 95f;
            r.Speed = Mathf.Clamp(r.Speed + throttle * accel * Time.deltaTime - r.Speed * drag * Time.deltaTime, -12f, maxSpeed);
            r.Position += transform.forward.normalized * (r.Speed * Time.deltaTime);
            r.Rotation *= Quaternion.Euler(0f, steer * turn * Time.deltaTime, 0f);
        }

        public void NotifyCheckpoint(string playerId, int checkpointIndex)
        {
            if (!_racers.TryGetValue(playerId, out var r)) return;
            if (Validation != null && !Validation.IsCheckpointSequenceValid(r.NextCheckpoint, checkpointIndex))
            {
                Log.Warn("RaceServer", $"Checkpoint invalide ignoré : {playerId} attend {r.NextCheckpoint}, reçu {checkpointIndex}");
                return;
            }
            r.NextCheckpoint = checkpointIndex + 1;
            if (checkpointIndex == 0) r.Lap++;
            if (Validation != null && r.Lap >= _config.Laps &&
                r.NextCheckpoint >= Validation.TotalCheckpoints(_config))
            {
                r.Finished = true;
                r.FinishTimeUtc = TimeUtil.UnixSeconds(DateTime.UtcNow);
            }
        }

        public void Tick()
        {
            switch (Phase)
            {
                case ServerRacePhase.WaitingForPlayers:
                    if (_racers.Count >= _config.MinPlayersToStart) SetPhase(ServerRacePhase.Countdown);
                    break;
                case ServerRacePhase.Countdown:
                    if (Time.timeSinceLevelLoad > _config.CountdownSeconds) SetPhase(ServerRacePhase.Racing);
                    break;
                case ServerRacePhase.Racing:
                    BroadcastSnapshots();
                    if (AllFinishedOrTimeout()) SetPhase(ServerRacePhase.Finishing);
                    break;
                case ServerRacePhase.Finishing:
                    ReportResults();
                    SetPhase(ServerRacePhase.Reported);
                    break;
                case ServerRacePhase.Reported:
                    SetPhase(ServerRacePhase.Closed);
                    break;
            }
        }

        private bool AllFinishedOrTimeout()
        {
            foreach (var r in _racers.Values) if (!r.Finished) return Phase != ServerRacePhase.Racing || false;
            return _racers.Count > 0;
        }

        private void BroadcastSnapshots()
        {
            _accumulator += Time.deltaTime;
            var step = 1f / Mathf.Max(1, _config.SnapshotRateHz);
            if (_accumulator < step) return;
            _accumulator -= step;
            _tick++;
            // RaceNetworkManager (com.racenations.racenet) sérialise et envoie via Netcode/UDP.
            // Ici on expose l'accroche ; le composant réseau branché en scène consomme OnSnapshot.
            OnSnapshot?.Invoke(_tick, SnapshotPayload());
        }

        public event Action<int, List<(string, Vector3, float, int, int)>> OnSnapshot;

        private List<(string, Vector3, float, int, int)> SnapshotPayload()
        {
            var list = new List<(string, Vector3, float, int, int)>(_racers.Count);
            foreach (var r in _racers.Values)
                list.Add((r.PlayerId, r.Position, r.Speed, r.Lap, r.NextCheckpoint));
            return list;
        }

        private void ReportResults()
        {
            var reporter = GetComponent<ServerResultReporter>();
            if (reporter == null)
            {
                Log.Warn("RaceServer", "ServerResultReporter absent : résultat non transmis (à corriger en prod).");
                return;
            }
            reporter.SubmitAsync(BuildFinishingOrder(), ok =>
            {
                if (!ok) Log.Error("RaceServer", "Échec de transmission du résultat au backend.");
            });
        }

        private IEnumerable<ServerRacer> BuildFinishingOrder()
        {
            var all = new List<ServerRacer>(_racers.Values);
            all.Sort((a, b) =>
            {
                if (a.Finished != b.Finished) return a.Finished ? -1 : 1;
                if (a.Lap != b.Lap) return b.Lap.CompareTo(a.Lap);
                return b.NextCheckpoint.CompareTo(a.NextCheckpoint);
            });
            return all;
        }

        public void Shutdown(string reason)
        {
            if (Phase == ServerRacePhase.Closed) return;
            Log.Info("RaceServer", $"Shutdown ({reason}) — flush final.");
            if (Phase == ServerRacePhase.Racing || Phase == ServerRacePhase.Finishing) ReportResults();
            SetPhase(ServerRacePhase.Closed);
        }

        private void SetPhase(ServerRacePhase p)
        {
            if (Phase == p) return;
            Phase = p;
            OnPhaseChanged?.Invoke(p);
        }
    }

    internal static class TimeUtil
    {
        private static readonly DateTime Epoch = new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        public static double UnixSeconds(DateTime utc) => (utc - Epoch).TotalSeconds;
    }
}
