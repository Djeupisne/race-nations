// Race Nations — Validation serveur anti-triche (INV-11 autorité serveur, INV-12 résultats auditable)
using System;
using System.Collections.Generic;
using RaceNations.Core;
using UnityEngine;

namespace RaceNations.Server
{
    /// <summary>
    /// Règles de validation appliquées par le serveur d'autorité :
    ///  - séquence de checkpoints strictement ordonnée (pas de saut / téléportation) ;
    ///  - temps de tour minimum physique (lap < minLapSeconds => replay impossible) ;
    ///  - cohérence vitesse/position entre deux snapshots (bornes maxSpeed * dt + marge) ;
    ///  - plafond d'inputs par tick (anti injection).
    /// Chaque rejet est journalisé avec le playerId pour l'audit backend.
    /// </summary>
    public class ServerValidation : MonoBehaviour
    {
        [SerializeField] private int checkpointsPerLap = 8;
        [SerializeField] private float speedSanityMargin = 1.35f; // tolérance réseau/dérive
        [SerializeField] private int maxInputsPerTick = 4;

        private readonly Dictionary<string, QueueState> _states = new();

        private class QueueState
        {
            public Vector3 LastPosition;
            public double LastTimeUtc;
            public int InputsThisTick;
            public double LapStartTimeUtc;
        }

        public int TotalCheckpoints(ServerConfig config) =>
            Math.Max(1, checkpointsPerLap) * Math.Max(1, config != null ? config.Laps : 1);

        /// <summary>Le checkpoint reçu doit être exactement le prochain attendu.</summary>
        public bool IsCheckpointSequenceValid(int expectedIndex, int receivedIndex) =>
            receivedIndex == expectedIndex;

        /// <summary>Détection de teleport : écart de position > maxSpeed*dt*marge.</summary>
        public bool IsMovementPlausible(string playerId, Vector3 newPosition, float reportedSpeed, double nowUtc)
        {
            if (!_states.TryGetValue(playerId, out var st))
            {
                _states[playerId] = new QueueState { LastPosition = newPosition, LastTimeUtc = nowUtc };
                return true;
            }
            var dt = Math.Max(0.001, nowUtc - st.LastTimeUtc);
            var maxDist = (float)(reportedSpeed * dt * speedSanityMargin);
            // Garde-fou : si le client rapporte une vitesse déraisonnable, on borne à la config serveur.
            var cap = (ServerValidationHooks.FallbackMaxSpeed ?? 80f) * (float)dt * speedSanityMargin;
            maxDist = Math.Min(maxDist, cap);
            var ok = Vector3.Distance(st.LastPosition, newPosition) <= maxDist + 2f;
            if (!ok) Log.Warn("Validation", $"Mouvement suspect ignoré : {playerId}");
            st.LastPosition = newPosition;
            st.LastTimeUtc = nowUtc;
            return ok;
        }

        /// <summary>Un tour plus rapide que le temps physique minimal est invalide.</summary>
        public bool IsLapTimeValid(double lapStartUtc, double lapEndUtc, double minLapSeconds)
        {
            var elapsed = lapEndUtc - lapStartUtc;
            if (elapsed < minLapSeconds)
            {
                Log.Warn("Validation", $"Temps de tour impossible ({elapsed:F2}s < {minLapSeconds:F2}s) — rejet.");
                return false;
            }
            return true;
        }

        /// <summary>Anti-injection : nombre d'inputs acceptés par tick et par joueur.</summary>
        public bool TryConsumeInputSlot(string playerId)
        {
            if (!_states.TryGetValue(playerId, out var st))
                st = _states[playerId] = new QueueState();
            if (st.InputsThisTick >= maxInputsPerTick) return false;
            st.InputsThisTick++;
            return true;
        }

        public void ResetTickCounters()
        {
            foreach (var st in _states.Values) st.InputsThisTick = 0;
        }

        public void ForgetPlayer(string playerId) => _states.Remove(playerId);
    }

    public static class ServerValidationHooks
    {
        // Limite de vitesse lue par le validateur sans couplage fort ;
        // renseignée par ServerBootstrap depuis sa config au démarrage.
        public static float? FallbackMaxSpeed = null;
    }
}
