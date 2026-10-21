using System;
using RaceNations.Network;
using UnityEngine;

namespace RaceNations.Core
{
    /// <summary>
    /// Point d'entrée runtime unique (préfab "Bootstrap" présent dans la scène de boot).
    /// Orchestration : AppConfig → ApiClient (singleton HTTP) → restauration de session
    /// (token sécurisé + refresh si révoqué) → connexion socket différée → scène menu.
    /// Un échec réseau au boot n'est PAS fatal : l'app démarre en mode hors-ligne et
    /// l'UI affiche un bandeau de statut (docs/frontend/ux-flow.md §boot).
    /// </summary>
    [DefaultExecutionOrder(-100)]
    public class GameBootstrap : MonoBehaviour
    {
        public static GameBootstrap Instance { get; private set; }
        public static bool IsReady { get; private set; }

        /// <summary>Levée quand la config + ApiClient sont initialisés (même hors-ligne).</summary>
        public event Action OnReady;

        [Header("Boot")]
        [SerializeField] private bool loadMenuSceneOnBoot = true;
        [SerializeField] private string menuSceneName = "MainMenu";
        [SerializeField] private bool connectSocketAtBoot = false; // lazy : à la 1re room

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            Application.targetFrameRate = 60;
        }

        private async void Start()
        {
            try
            {
                var config = AppConfig.Load();
                Log.Info($"[Bootstrap] env={config.Environment} api={config.ApiBaseUrl}");

                ApiClient.Initialize(config);
                await AuthApi.RestoreSessionOrNull();

                if (connectSocketAtBoot)
                    SocketClient.Instance?.Connect(config.WsUrl, ApiClient.Instance.AccessToken);

                IsReady = true;
                OnReady?.Invoke();

                if (loadMenuSceneOnBoot && !string.IsNullOrEmpty(menuSceneName))
                    SceneLoader.LoadAsync(menuSceneName);
            }
            catch (Exception e)
            {
                // On ne crashe jamais au boot : mode dégradé avec logs.
                Debug.LogError($"[Bootstrap] erreur récupérée : {e}");
                IsReady = true; // l'UI doit pouvoir s'afficher en offline
                OnReady?.Invoke();
            }
        }

        private void OnApplicationQuit()
        {
            try { SocketClient.ShutdownAll(); }
            catch (Exception e) { Log.Warn($"[Bootstrap] shutdown socket : {e.Message}"); }
        }
    }
}
