using System;
using Newtonsoft.Json;
using UnityEngine;

namespace RaceNations.Core
{
    /// <summary>
    /// Configuration applicative chargée au boot : URLs API/WS, environnement, timeouts.
    /// Lue depuis StreamingAssets/config.json (build) ou surchargée par les variables
    /// d'environnement RACE_* (parité dev/prod). Aucun secret ici — uniquement des endpoints.
    /// </summary>
    [Serializable]
    public class AppConfig
    {
        [JsonProperty("environment")] public string Environment = "development";
        [JsonProperty("apiBaseUrl")] public string ApiBaseUrl = "http://localhost:3000/api";
        [JsonProperty("wsUrl")] public string WsUrl = "ws://localhost:3000/ws";
        [JsonProperty("cdnBaseUrl")] public string CdnBaseUrl = "https://cdn.racenations.local";
        [JsonProperty("requestTimeoutSeconds")] public int RequestTimeoutSeconds = 15;
        [JsonProperty("socketReconnectMaxDelaySeconds")] public float SocketReconnectMaxDelaySeconds = 30f;
        [JsonProperty("minSupportedApiVersion")] public int MinSupportedApiVersion = 1;

        private const string ConfigPath = "config.json";

        public static AppConfig Current { get; private set; }

        /// <summary>Chargement idempotent avec valeurs par défaut tolérantes (boot jamais bloqué).</summary>
        public static AppConfig Load()
        {
            if (Current != null) return Current;
            try
            {
                var json = ReadStreamingAsset(ConfigPath);
                Current = JsonConvert.DeserializeObject<AppConfig>(json) ?? new AppConfig();
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[AppConfig] config.json absent/invalide ({e.Message}) — valeurs par défaut.");
                Current = new AppConfig();
            }
            Current.ApplyEnvOverrides();
            return Current;
        }

        private static string ReadStreamingAsset(string file)
        {
#if UNITY_EDITOR
            var editorPath = System.IO.Path.Combine(Application.dataPath, "../StreamingAssets", file);
            return System.IO.File.ReadAllText(editorPath);
#else
            var url = System.IO.Path.Combine(Application.streamingAssetsPath, file);
            if (url.Contains("://") && !url.StartsWith("file://"))
            {
                // Android/WebGL : le fichier est dans l'archive → lecture synchrone impossible.
                // On bloque brièvement sur UnityWebRequest (le boot est déjà asynchrone côté GameBootstrap).
                using var req = UnityEngine.Networking.UnityWebRequest.Get(url);
                req.SendWebRequest().completed += _ => { };
                while (!req.isDone) { }
                return req.result == UnityEngine.Networking.UnityWebRequest.Result.Success
                    ? req.downloadHandler.text
                    : "{}";
            }
            return System.IO.File.ReadAllText(url.Replace("file://", string.Empty));
#endif
        }

        private void ApplyEnvOverrides()
        {
            Overridable(ref ApiBaseUrl, "RACE_API_BASE_URL");
            Overridable(ref WsUrl, "RACE_WS_URL");
            Overridable(ref Environment, "RACE_ENVIRONMENT");
        }

        private static void Overridable(ref string field, string envVar)
        {
            var value = Environment.GetEnvironmentVariable(envVar);
            if (!string.IsNullOrEmpty(value)) field = value;
        }

        /// <summary>Construit une URI absolue à partir d'un chemin relatif type "v1/betting/markets".</summary>
        public Uri ApiUri(string path) => new Uri(new Uri(ApiBaseUrl.TrimEnd('/') + "/"), path.TrimStart('/'));

        /// <summary>Versionne automatiquement les chemins sans préfixe v1 (docs/api-versioning.md).</summary>
        public string NormalizeApiPath(string path)
        {
            var p = path.TrimStart('/');
            return p.StartsWith("v1/") || p.StartsWith("v2/") ? p : "v1/" + p;
        }
    }
}
