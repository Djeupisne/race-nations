using System;
using System.Collections.Generic;
using System.Threading;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using RaceNations.Core;
using UnityEngine;
using UnityEngine.Networking;

namespace RaceNations.Network
{
    /// <summary>Résultat typé d'un appel API : success + payload, ou erreur normalisée backend.</summary>
    public class ApiResult<T>
    {
        public bool Success;
        public int StatusCode;
        public T Data;
        public string ErrorCode;    // code domaine backend (ex. INSUFFICIENT_FUNDS) — docs/api.md §2
        public string ErrorMessage;
        public JObject ErrorJson;

        public static ApiResult<T> FromJson(int status, string json)
        {
            if (status >= 200 && status < 300)
            {
                T data = default;
                if (!string.IsNullOrWhiteSpace(json))
                {
                    try { data = JsonConvert.DeserializeObject<T>(json); }
                    catch (Exception e)
                    {
                        return new ApiResult<T> { Success = false, StatusCode = status, ErrorMessage = "deserialize: " + e.Message };
                    }
                }
                return new ApiResult<T> { Success = true, StatusCode = status, Data = data };
            }

            var result = new ApiResult<T> { Success = false, StatusCode = status, ErrorMessage = json };
            try
            {
                var jo = JObject.Parse(json);
                result.ErrorJson = jo;
                result.ErrorCode = (string)(jo["error"]?["code"] ?? jo["code"]);
                result.ErrorMessage = (string)(jo["error"]?["message"] ?? jo["message"]) ?? json;
            }
            catch { /* réponse non-JSON (proxy HTML etc.) */ }
            return result;
        }
    }

    /// <summary>
    /// Client HTTP vers le backend NestJS (/api/v1/...). Basé sur UnityWebRequest
    /// (compatible tous builds dont WebGL), Newtonsoft pour la sérialisation.
    /// En-têtes : Authorization Bearer, X-Request-Id (traceabilité E2E), X-Idempotency-Key
    /// (obligatoire sur les écritures sensibles — INV-04 côté serveur).
    /// Politiques : timeout config, retry borné sur erreurs réseau/5xx UNIQUEMENT si l'appel
    /// est sûr (GET ou POST porteur d'une clé d'idempotence), re-refresh unique sur 401.
    /// </summary>
    public class ApiClient
    {
        public static ApiClient Instance { get; private set; }

        public string AccessToken { get; set; }
        public event Action OnUnauthorized;

        private readonly AppConfig _config;
        private const int MaxRetries = 2;
        private const int RetryBaseDelayMs = 400;

        public static void Initialize(AppConfig config)
        {
            Instance = new ApiClient(config);
        }

        public ApiClient(AppConfig config)
        {
            _config = config ?? AppConfig.Load();
        }

        // ------------------------------------------------------------------ verbes

        public void GetAsync<T>(string path, Action<ApiResult<T>> onDone) =>
            Send(UnityWebRequest.kHttpVerbGET, path, null, null, onDone);

        public void PostAsync<T>(string path, object body, string idempotencyKey, Action<ApiResult<T>> onDone) =>
            Send(UnityWebRequest.kHttpVerbPOST, path, body, idempotencyKey, onDone);

        public void PatchAsync<T>(string path, object body, Action<ApiResult<T>> onDone) =>
            Send("PATCH", path, body, null, onDone);

        /// <summary>Version coroutine interne — utilisée aussi par les wrappers async Task.</summary>
        public IEnumerator SendCoroutine<T>(string method, string path, object body, string idempotencyKey, Action<ApiResult<T>> onDone)
        {
            var url = _config.ApiUri(_config.NormalizeApiPath(path)).ToString();
            var request = new UnityWebRequest(url, method);
            request.timeout = _config.RequestTimeoutSeconds;
            request.downloadHandler = new DownloadHandlerBuffer();

            var json = body == null ? null : JsonConvert.SerializeObject(body);
            if (json != null)
            {
                request.uploadHandler = new UploadHandlerRaw(System.Text.Encoding.UTF8.GetBytes(json));
                request.SetRequestHeader("Content-Type", "application/json");
            }
            if (!string.IsNullOrEmpty(AccessToken))
                request.SetRequestHeader("Authorization", $"Bearer {AccessToken}");
            request.SetRequestHeader("X-Request-Id", Guid.NewGuid().ToString("N"));
            if (!string.IsNullOrEmpty(idempotencyKey))
                request.SetRequestHeader("X-Idempotency-Key", idempotencyKey);

            var safeToRetry = method == UnityWebRequest.kHttpVerbGET || !string.IsNullOrEmpty(idempotencyKey);

            for (var attempt = 0; attempt <= MaxRetries; attempt++)
            {
                var op = request.SendWebRequest();
                while (!op.isDone) yield return null;

                var status = (int)request.responseCode;
                var text = request.downloadHandler.text ?? string.Empty;

                // Erreur transport (DNS, timeout) : statut 0 → retry si appel sûr.
                if (request.result == UnityWebRequest.Result.ConnectionError ||
                    request.result == UnityWebRequest.Result.ProtocolError && status == 0)
                {
                    if (safeToRetry && attempt < MaxRetries)
                    {
                        yield return new WaitForSecondsRealtime(RetryBaseDelayMs * (attempt + 1) / 1000f);
                        request = Clone(request);
                        continue;
                    }
                    onDone?.Invoke(new ApiResult<T> { Success = false, StatusCode = 0, ErrorMessage = request.error });
                    request.Dispose();
                    yield break;
                }

                if (status == 401)
                {
                    // Une seule tentative de refresh, puis logout (refresh rotation serveur).
                    var refreshed = false;
                    yield return AuthApi.RefreshOnce(ok => refreshed = ok);
                    if (refreshed && attempt < MaxRetries)
                    {
                        request.Dispose();
                        request = Clone(request);
                        request.SetRequestHeader("Authorization", $"Bearer {AccessToken}");
                        continue;
                    }
                    OnUnauthorized?.Invoke();
                    onDone?.Invoke(ApiResult<T>.FromJson(status, text));
                    request.Dispose();
                    yield break;
                }

                if (status >= 500 && safeToRetry && attempt < MaxRetries)
                {
                    yield return new WaitForSecondsRealtime(RetryBaseDelayMs * (attempt + 1) / 1000f);
                    request.Dispose();
                    request = Clone(request);
                    continue;
                }

                onDone?.Invoke(ApiResult<T>.FromJson(status, text));
                request.Dispose();
                yield break;
            }
        }

        private void Send<T>(string method, string path, object body, string idempotencyKey, Action<ApiResult<T>> onDone)
        {
            if (Instance != this) throw new InvalidOperationException("ApiClient non initialisé.");
            CoroutineHost.Run(SendCoroutine(method, path, body, idempotencyKey, onDone));
        }

        private UnityWebRequest Clone(UnityWebRequest old)
        {
            var req = new UnityWebRequest(old.url, old.method);
            req.timeout = old.timeout;
            req.downloadHandler = new DownloadHandlerBuffer();
            if (old.uploadHandler != null)
            {
                req.uploadHandler = new UploadHandlerRaw(old.uploadHandler.data);
                req.SetRequestHeader("Content-Type", "application/json");
            }
            if (!string.IsNullOrEmpty(AccessToken))
                req.SetRequestHeader("Authorization", $"Bearer {AccessToken}");
            req.SetRequestHeader("X-Request-Id", Guid.NewGuid().ToString("N"));
            return req;
        }

        /// <summary>Hôte coroutine singleton créé par Initialize (détruit à la fermeture app).</summary>
        private class CoroutineHost : MonoBehaviour
        {
            private static CoroutineHost _instance;

            public static void Run(IEnumerator routine)
            {
                if (_instance == null)
                {
                    var go = new GameObject("[RaceNations.ApiClient]");
                    DontDestroyOnLoad(go);
                    _instance = go.AddComponent<CoroutineHost>();
                }
                _instance.StartCoroutine(routine);
            }
        }
    }
}
