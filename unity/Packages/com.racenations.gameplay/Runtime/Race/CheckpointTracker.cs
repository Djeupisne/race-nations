using System;
using RaceNations.Gameplay.Vehicles;
using UnityEngine;

namespace RaceNations.Gameplay.Race
{
    /// <summary>
    /// Volume trigger d'un checkpoint. Placé sur la ligne (start/finish ou intermédiaire),
    /// indexé dans l'ordre de la piste par le TrackLoader. Il ne fait QUE relayer la
    /// validation vers RaceManager.TryPassCheckpoint() — aucune logique de course ici,
    /// pour que le serveur autoritaire puisse rejouer exactement les mêmes règles.
    /// Anti-faux-positif : seuls les véhicules en phase Racing sont comptés ; le même
    /// véhicule rebondissant sur le trigger est ignoré (cooldown local + contrôle serveur).
    /// </summary>
    [RequireComponent(typeof(Collider))]
    public class CheckpointTracker : MonoBehaviour
    {
        [SerializeField] private int checkpointIndex = -1; // -1 → auto-détecté via ordre de scène

        public int CheckpointIndex => checkpointIndex;

        private void Reset()
        {
            var col = GetComponent<Collider>();
            col.isTrigger = true;
        }

        private void OnTriggerEnter(Collider other)
        {
            if (RaceManager.Instance == null) return;
            if (RaceManager.Instance.Phase != RacePhase.Racing) return;

            var vehicle = other.GetComponentInParent<VehicleController>();
            if (vehicle == null) return;

            var racerId = vehicle.name; // convention : GameObject nommé par playerId/racerId
            var passed = RaceManager.Instance.TryPassCheckpoint(racerId, checkpointIndex);
            if (passed)
                Log.Info($"[Checkpoint] {racerId} valide cp#{checkpointIndex}");
        }
    }
}
