using System;
using RaceNations.Core;
using UnityEngine;

namespace RaceNations.Gameplay.Vehicles
{
    /// <summary>
    /// Statistiques de conduite partagées (véhicule joueur + IA) — la physique lit ces
    /// valeurs, jamais des champs éparpillés. Valeurs par défaut calibrées pour un kart
    /// super-motocross arcade (docs/game-design/vehicle-model.md) : accél. franche, grip
    /// élevé, drift toléré au frein + contre-arc.
    /// </summary>
    [Serializable]
    public class VehicleStats
    {
        [Header("Moteur")]
        public float MaxSpeedKmh = 210f;          // vitesse max en ligne droite (rapport de transmission simulé)
        public float AccelerationMs2 = 14f;       // poussée plein gaz
        public float BrakeForceMs2 = 24f;         // décélération frein
        public float ReverseMaxSpeedKmh = 45f;
        public float DragCoefficient = 0.35f;     // traînée aérodynamique quadratique

        [Header("Direction / adhérence")]
        public float SteerMaxAngleDeg = 32f;
        public float SteerResponseHz = 6f;        // lissage entrée volant (anti-twitch)
        public float LateralGrip = 12f;           // restitution latérale max (m/s²) avant glisse
        public float DriftGripMultiplier = 0.45f; // grip réduit quand drift actif
        public float RollResistance = 1.8f;

        [Header("Dérive / boost")]
        public float DriftChargePerSecond = 22f;  // jauge mini-boost pendant une dérive propre
        public float BoostMultiplier = 1.35f;     // gain de vitesse max pendant le boost
        public float BoostDurationSeconds = 2.2f;

        [Range(0f, 1f)] public float SurfaceGripScale = 1f; // modifié par WeatherSystem (pluie ↓)
    }

    /// <summary>
    /// Contrôleur de véhicule arcade basé sur un Rigidbody (aucune dépendance WheelCollider
    /// → déterministe et testable en EditMode avec des Rigidbodies cinématiques côté serveur).
    /// Modèle simplifié "raycast-lite" : forces longitudinales dans l'axe du châssis,
    /// correction latérale type suspension (veto si dépassement du grip budget), saut
    /// anti-volure à l'atterrissage. Gère aussi : régénération du boost par dérive,
    /// exposition de l'état pour le HUD (speedKmh, drifting, boosting) et hooks réseau
    /// (RaceNetworkManager lit GetSnapshot() à 15 Hz — pas d'envoi ici, séparation nette).
    /// </summary>
    [RequireComponent(typeof(Rigidbody))]
    public class VehicleController : MonoBehaviour
    {
        [SerializeField] private VehicleStats stats = new();
        [SerializeField] private Transform centerOfMass; // optionnel, abaisse le CoM

        private Rigidbody _rb;
        private float _steerInput;      // [-1..1]
        private float _throttleInput;   // [-1..1] (négatif = frein/recul)
        private float _smoothedSteer;
        private float _driftCharge;
        private float _boostTimer;
        private bool _grounded;
        private float _lastSpeedKmh;

        public float SpeedKmh => _lastSpeedKmh;
        public bool IsDrifting { get; private set; }
        public bool IsBoosting => _boostTimer > 0f;
        public float DriftCharge01 => Mathf.Clamp01(_driftCharge / 100f);
        public VehicleStats Stats => stats;

        private void Awake()
        {
            _rb = GetComponent<Rigidbody>();
            _rb.centerOfMass = centerOfMass != null
                ? transform.InverseTransformPoint(centerOfMass.position)
                : new Vector3(0, -0.4f, 0);
            _rb.interpolation = RigidbodyInterpolation.Interpolate;
            _rb.collisionDetectionMode = CollisionDetectionMode.ContinuousDynamic;
        }

        // ---------------------------------------------------------------- entrées
        // Appelés par PlayerInput (joueur) ou AIDriver (bots) — même interface pour les deux.

        public void SetSteerInput(float value) => _steerInput = Mathf.Clamp(value, -1f, 1f);
        public void SetThrottleInput(float value) => _throttleInput = Mathf.Clamp(value, -1f, 1f);
        public void SetDriftHeld(bool held) => _driftHeld = held;
        public void TriggerBoost()
        {
            if (_driftCharge >= 100f)
            {
                _driftCharge = 0f;
                _boostTimer = stats.BoostDurationSeconds;
            }
        }
        private bool _driftHeld;

        private void FixedUpdate()
        {
            ApplyGroundCheck();
            var velocity = _rb.linearVelocity; // Unity 6 ; remplacer par velocity si 2021/2022
            var forward = transform.forward;
            var right = transform.right;

            var speedAlongForward = Vector3.Dot(velocity, forward);
            var lateralSpeed = Vector3.Dot(velocity, right);

            // --- Longitudinal : throttle / frein / traînée ---
            var maxSpeed = stats.MaxSpeedKmh / 3.6f * (IsBoosting ? stats.BoostMultiplier : 1f);
            var longitudinalForce = 0f;
            if (_throttleInput > 0f)
            {
                // Rampe classique : pleine poussée sous maxSpeed, coupe au plafond.
                var headroom = Mathf.Clamp01((maxSpeed - speedAlongForward) / Mathf.Max(maxSpeed, 0.01f));
                longitudinalForce = _throttleInput * stats.AccelerationMs2 * mass01(headroom);
            }
            else if (_throttleInput < 0f)
            {
                if (speedAlongForward > 0.5f)
                    longitudinalForce = _throttleInput * stats.BrakeForceMs2; // freine
                else
                    longitudinalForce = _throttleInput * stats.AccelerationMs2 * 0.5f; // marche AR
            }
            // Traînée quadratique + résistance au roulement.
            var drag = speedAlongForward * Mathf.Abs(speedAlongForward) * stats.DragCoefficient;
            longitudinalForce -= drag + Mathf.Sign(speedAlongForward) * stats.RollResistance;

            _rb.AddForce(forward * longitudinalForce * _rb.mass, ForceMode.Force);

            // --- Latéral : budget d'adhérence (grip) puis glisse contrôlée ---
            var gripBudget = stats.LateralGrip * stats.SurfaceGripScale *
                             (IsDrifting ? stats.DriftGripMultiplier : 1f);
            // Viscosités latérales proportionnelles : annule la dérive non voulue.
            var lateralCorrection = -lateralSpeed * gripBudget * Time.fixedDeltaTime * 8f;
            _rb.AddForce(right * lateralCorrection * _rb.mass, ForceMode.Force);

            // --- Direction : rotation yaw pilotée (modèle arcade stable) ---
            _smoothedSteer = Mathf.MoveTowards(_smoothedSteer, _steerInput,
                stats.SteerResponseHz * Time.fixedDeltaTime);
            var steerAuthority = stats.SteerMaxAngleDeg * Mathf.Deg2Rad;
            var speedFactor = Mathf.Clamp01(Mathf.Abs(speedAlongForward) / (maxSpeed * 0.35f));
            var turnRate = _smoothedSteer * steerAuthority * speedFactor *
                           Mathf.Sign(speedAlongForward == 0 ? 1 : speedAlongForward);
            var targetYaw = Quaternion.AngleAxis(turnRate * 3f * Time.fixedDeltaTime, Vector3.up);
            _rb.MoveRotation(_rb.rotation * targetYaw);

            // --- Détection de dérive + charge du boost ---
            var slipAngle = Mathf.Abs(Mathf.Atan2(lateralSpeed, Mathf.Max(Mathf.Abs(speedAlongForward), 1f)));
            IsDrifting = _driftHeld && slipAngle > 0.18f && _lastSpeedKmh > 60f && _grounded;
            if (IsDrifting)
                _driftCharge = Mathf.Min(100f, _driftCharge + stats.DriftChargePerSecond * Time.fixedDeltaTime);
            else if (!IsBoosting)
                _driftCharge = Mathf.Max(0f, _driftCharge - 12f * Time.fixedDeltaTime);

            if (_boostTimer > 0f) _boostTimer -= Time.fixedDeltaTime;

            // Anti-volure : plaque légèrement en l'air pour garder le contrôle aérien court.
            if (!_grounded)
                _rb.AddForce(Vector3.down * _rb.mass * 9.81f * 0.6f, ForceMode.Force);

            _lastSpeedKmh = velocity.magnitude * 3.6f;
        }

        private static float mass01(float t) => Mathf.Lerp(0.15f, 1f, Mathf.Clamp01(t));

        private void ApplyGroundCheck()
        {
            _grounded = Physics.Raycast(transform.position + Vector3.up * 0.4f, Vector3.down,
                out _, 1.1f, GetLayerMask());
        }

        private static int GetLayerMask() => ~LayerMask.GetMask("Vehicle");

        /// <summary>Schéma compact consommé par RaceNetworkManager (snapshot 15 Hz) et les replays.</summary>
        public RaceSnapshot GetSnapshot() => new RaceSnapshot
        {
            Position = new[] { transform.position.x, transform.position.y, transform.position.z },
            RotationY = transform.eulerAngles.y,
            SpeedKmh = _lastSpeedKmh,
            Throttle = _throttleInput,
            Steer = _smoothedSteer,
            Drifting = IsDrifting,
            Boosting = IsBoosting,
            Tick = (uint)Time.frameCount,
        };

        /// <summary>Application d'un snapshot distant (autres joueurs) avec smoothing positionnel.</summary>
        public void ApplyRemoteSnapshot(RaceSnapshot snap)
        {
            var target = new Vector3(snap.Position[0], snap.Position[1], snap.Position[2]);
            transform.position = Vector3.Lerp(transform.position, target, 0.35f);
            transform.rotation = Quaternion.Euler(0, snap.RotationY, 0);
            _lastSpeedKmh = snap.SpeedKmh;
        }
    }

    [Serializable]
    public class RaceSnapshot
    {
        public float[] Position;
        public float RotationY;
        public float SpeedKmh;
        public float Throttle;
        public float Steer;
        public bool Drifting;
        public bool Boosting;
        public uint Tick;
    }
}
