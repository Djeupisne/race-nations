using System;
using System.Collections;
using Newtonsoft.Json.Linq;
using RaceNations.Core;
using RaceNations.Gameplay.Vehicles;
using RaceNations.Network;
using UnityEngine;

namespace RaceNations.RaceNet
{
    /// <summary>
    /// Pont course ↔ temps réel. Côté envoi : publie le snapshot du véhicule local à
    /// 15 Hz (throttle de bande passante mobile — docs/networking/sync.md) et les
    /// validations de checkpoint dès qu'elles surviennent. Côté réception : applique
    /// les snapshots distants avec interpolation, et pilote la machine à états locale
    /// RaceManager par les messages AUTORITAIRES du serveur uniquement
    /// (race.countdown / race.start / race.checkpoint_ack / race.finish).
    /// Règle d'or : le client ne déclare jamais sa victoire — seul race.finish du
    /// serveur (signé matchId) termine une course classée ; en mode hors-ligne/IA,
    /// RaceManager tourne sans ce composant.
    /// </summary>
    public class RaceNetworkManager : MonoBehaviour
    {
        [SerializeField] private float snapshotIntervalSeconds = 1f / 15f;
        [SerializeField] private VehicleController localVehicle;
        [SerializeField] private string roomCode;

        private SocketClient _socket;
        private float _lastSnapshotTime;
        private Coroutine _retryJoin;

        public string RoomCode => roomCode;
        public event Action<string, JObject> OnRemoteCheckpoint;

        private void Start()
        {
            _socket = SocketClient.EnsureInstance();
            _socket.On += "race.countdown", OnCountdown;
            _socket.On += "race.start", OnRaceStart;
            _socket.On += "race.snapshot", OnRemoteSnapshot;
            _socket.On += "race.checkpoint_ack", OnCheckpointAck;
            _socket.On += "race.finish", OnServerFinish;
            _socket.OnConnected += TryJoinRoom;

            if (_socket.State == SocketState.Connected) TryJoinRoom();
        }

        private void OnDestroy()
        {
            if (_socket != null)
            {
                _socket.Off("race.countdown", OnCountdown);
                _socket.Off("race.start", OnRaceStart);
                _socket.Off("race.snapshot", OnRemoteSnapshot);
                _socket.Off("race.checkpoint_ack", OnCheckpointAck);
                _socket.Off("race.finish", OnServerFinish);
                _socket.OnConnected -= TryJoinRoom;
            }
        }

        // ---------------------------------------------------------------- join

        private void TryJoinRoom()
        {
            if (string.IsNullOrEmpty(roomCode)) return;
            if (_socket.State != SocketState.Connected)
            {
                _retryJoin ??= StartCoroutine(RetryJoinLater());
                return;
            }
            if (_retryJoin != null) { StopCoroutine(_retryJoin); _retryJoin = null; }
            _socket.Emit("room.join", new { code = roomCode, channel = "race" });
            Log.Info($"[RaceNet] joint room {roomCode}");
        }

        private IEnumerator RetryJoinLater()
        {
            yield return new WaitUntil(() => _socket.State == SocketState.Connected);
            TryJoinRoom();
        }

        // ---------------------------------------------------------------- publish

        private void Update()
        {
            if (localVehicle == null || _socket.State != SocketState.Connected) return;
            if (RaceManager.Instance == null || RaceManager.Instance.Phase != RacePhase.Racing) return;
            if (Time.unscaledTime - _lastSnapshotTime < snapshotIntervalSeconds) return;

            _lastSnapshotTime = Time.unscaledTime;
            _socket.Emit("race.snapshot", new
            {
                room = roomCode,
                snap = localVehicle.GetSnapshot(),
                serverTick = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            });
        }

        /// <summary>Hook appelé par CheckpointTracker (via un event RaceManager si câblé côté scène).</summary>
        public void ReportCheckpoint(int checkpointIndex)
        {
            _socket?.Emit("race.checkpoint_claim", new { room = roomCode, cp = checkpointIndex });
        }

        // ---------------------------------------------------------------- receive

        private void OnCountdown(JObject d)
        {
            RaceManager.Instance?.StartCountdown();
        }

        private void OnRaceStart(JObject d)
        {
            // Le serveur impose l'instant GO ; offset calculé par ping sync (simplifié ici).
            var serverNow = (long)d["serverTime"];
            var offset = (serverNow - DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()) / 1000f;
            RaceManager.Instance?.ServerForceStart(offset);
        }

        private void OnRemoteSnapshot(JObject d)
        {
            var racerId = (string)d["racerId"];
            var remote = FindRemoteVehicle(racerId);
            if (remote == null) return;
            var snap = d["snap"]?.ToObject<RaceSnapshot>();
            if (snap != null) remote.ApplyRemoteSnapshot(snap);
        }

        private void OnCheckpointAck(JObject d)
        {
            // ACK/NACK serveur : un NACK signale une tentative de skip → UI + flag anti-cheat.
            var racerId = (string)d["racerId"];
            var valid = (bool?)d["valid"] ?? false;
            if (!valid) Log.Warn($"[RaceNet] checkpoint refusé serveur pour {racerId}");
            OnRemoteCheckpoint?.Invoke(racerId, d);
        }

        private void OnServerFinish(JObject d)
        {
            // Source de vérité du classement final (mode classé) : on gel le local.
            var standings = d["standings"] as JArray;
            Log.Info($"[RaceNet] finish serveur reçu ({standings?.Count ?? 0} classements).");
            RaceManager.Instance?.AbortRace("course terminée par le serveur");
        }

        private VehicleController FindRemoteVehicle(string racerId)
        {
            if (string.IsNullOrEmpty(racerId)) return null;
            var go = GameObject.Find(racerId);
            return go != null ? go.GetComponent<VehicleController>() : null;
        }
    }
}
