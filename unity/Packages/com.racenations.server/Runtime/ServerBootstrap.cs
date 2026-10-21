// Race Nations — Bootstrap du serveur headless (scene ServerBoot.unity, mode -batchmode)
using System;
using RaceNations.Betting;
using RaceNations.Core;
using RaceNations.Network;
using UnityEngine;

namespace RaceNations.Server
{
    /// <summary>
    /// Point d'entrée du build dédié (Unity server headless).
    /// Responsabilités :
    ///  - détecter le mode batch/headless et configurer tick rate + log non interactif ;
    ///  - initialiser AppConfig/ApiClient/SecureStore (via GameBootstrap si présent en scène) ;
    ///  - démarrer RaceServerManager (autorités de course + validation) ;
    ///  - gérer les signaux d'arrêt propre (SIGTERM traduit par Agones → OnApplicationQuit).
    /// </summary>
    public class ServerBootstrap : MonoBehaviour
    {
        public static ServerBootstrap Instance { get; private set; }

        [SerializeField] private ServerConfig config;
        [SerializeField] private bool autoStart = true;

        public RaceServerManager Server { get; private set; }
        public bool IsRunning { get; private set; }
        public DateTime StartedAtUtc { get; private set; }

        public static bool IsHeadless =>
            Application.isBatchMode || Environment.GetCommandLineArgs().Length > 0 &&
            Array.Exists(Environment.GetCommandLineArgs(), a => a == "-headless" || a == "-batchmode");

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;

            config ??= ServerConfig.LoadOrDefault();

            if (IsHeadless)
            {
                // Headless : pas de rendu, tick réseau uniquement.
                Application.targetFrameRate = config.ServerTargetTickRate; // ex. 30 Hz réseau
                QualitySettings.vSyncCount = 0;
                Debug.logEnableCallStack = false;
            }

            DontDestroyOnLoad(gameObject);
            Log.Info("Server", $"ServerBootstrap éveillé (headless={IsHeadless}, tick={config.ServerTargetTickRate})");
        }

        private void Start()
        {
            if (!autoStart) return;
            StartServer();
        }

        public void StartServer()
        {
            if (IsRunning) return;

            // 1. Services réseau (idempotent si GameBootstrap a déjà initialisé ApiClient).
            if (ApiClient.Instance == null) ApiClient.Initialize(config.ToAppConfig());

            // 2. Gestionnaire d'autorité de course.
            var go = new GameObject(nameof(RaceServerManager));
            go.transform.SetParent(transform, false);
            Server = go.AddComponent<RaceServerManager>();
            Server.Configure(config);
            Server.StartAccepting();

            // 3. Validation anti-triche / intégrité des résultats.
            var validation = gameObject.GetComponent<ServerValidation>() ?? gameObject.AddComponent<ServerValidation>();
            Server.Validation = validation;

            IsRunning = true;
            StartedAtUtc = DateTime.UtcNow;
            Log.Info("Server", "Serveur démarré : prêt à accepter des sessions de course.");
        }

        public void StopServer(string reason)
        {
            if (!IsRunning) return;
            Server?.Shutdown(reason);
            IsRunning = false;
            Log.Info("Server", $"Serveur arrêté ({reason}).");
        }

        private void OnApplicationQuit()
        {
            // Arrêt propre : flush des résultats & heartbeat Agones avant exit (INV-15).
            StopServer("OnApplicationQuit");
        }

        private void Update()
        {
            if (!IsRunning) return;
            Server?.Tick();
        }
    }
}
