using System;
using System.Collections;
using System.Collections.Generic;
using System.Text;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using RaceNations.Core;
using UnityEngine;
using NativeWebSocket;

namespace RaceNations.Network
{
    public enum SocketState { Disconnected, Connecting, Connected, Reconnecting }

    /// <summary>
    /// Client temps réel vers le gateway Nest (@nestjs/websockets — docs/backend/gateway.md).
    /// NativeWebSocket : connexe au thread principal (Update pump), compatible WebGL.
    /// Discipline :
    ///  - authentification par query token + message "auth" après ouverture,
    ///  - heartbeat client toutes les 20 s (le gateway purge les clients muets),
    ///  - reconnexion exponentielle bornée (max AppConfig.SocketReconnectMaxDelaySeconds),
    ///  - trame typée { t: type, d: data } dispatchée vers les handlers enregistrés,
    ///  - jamais de mutation d'état de jeu hors du fil principal : tout arrive via events.
    /// </summary>
    public class SocketClient : MonoBehaviour
    {
        public static SocketClient Instance { get; private set; }

        public SocketState State { get; private set; } = SocketState.Disconnected;
        public event Action OnConnected;
        public event Action OnDisconnected;
        public event Action<JObject> OnAnyMessage;

        private readonly Dictionary<string, List<Action<JObject>>> _handlers = new();
        private WebSocket _socket;
        private string _baseUrl;
        private string _token;
        private float _lastPingTime;
        private int _reconnectAttempts;
        private bool _shutdownRequested;

        private const float PingIntervalSeconds = 20f;

        public static SocketClient EnsureInstance()
        {
            if (Instance == null)
            {
                var go = new GameObject("[RaceNations.SocketClient]");
                DontDestroyOnLoad(go);
                Instance = go.AddComponent<SocketClient>();
            }
            return Instance;
        }

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
        }

        public void Connect(string wsUrl, string accessToken)
        {
            _baseUrl = wsUrl;
            _token = accessToken;
            _shutdownRequested = false;
            _ = ConnectAsync();
        }

        private async System.Threading.Tasks.Task ConnectAsync()
        {
            if (State is SocketState.Connected or SocketState.Connecting) return;
            State = SocketState.Connecting;
            try
            {
                var uri = _baseUrl + (_baseUrl.Contains("?") ? "&" : "?") +
                          "token=" + Uri.EscapeDataString(_token ?? string.Empty);
                _socket = new WebSocket(uri);
                _socket.OnOpen += HandleOpen;
                _socket.OnMessage += HandleMessage;
                _socket.OnClose += HandleClose;
                _socket.OnError += (e) => Log.Warn($"[Socket] erreur : {e}");
                await _socket.Connect();
            }
            catch (Exception e)
            {
                Log.Warn($"[Socket] échec connexion : {e.Message}");
                ScheduleReconnect();
            }
        }

        private void HandleOpen()
        {
            State = SocketState.Connected;
            _reconnectAttempts = 0;
            _lastPingTime = Time.unscaledTime;
            Log.Info("[Socket] connecté.");
            Emit("auth", new { token = _token }); // handshake attendu par le gateway
            OnConnected?.Invoke();
        }

        private void HandleMessage(byte[] bytes)
        {
            var text = Encoding.UTF8.GetString(bytes);
            JObject msg;
            try { msg = JObject.Parse(text); }
            catch { Log.Warn("[Socket] message non-JSON ignoré."); return; }

            var type = (string)msg["t"];
            OnAnyMessage?.Invoke(msg);
            if (type != null && _handlers.TryGetValue(type, out var list))
            {
                foreach (var handler in list.ToArray())
                {
                    try { handler(msg["d"] as JObject ?? new JObject()); }
                    catch (Exception e) { Debug.LogException(e); } // un handler KO ne casse pas le flux
                }
            }
        }

        private void HandleClose(WebSocketCloseCode code)
        {
            if (State == SocketState.Disconnected) return;
            State = SocketState.Disconnected;
            OnDisconnected?.Invoke();
            if (!_shutdownRequested) ScheduleReconnect();
        }

        public void Emit(string type, object payload = null)
        {
            if (_socket == null || _socket.State != WebSocketState.Open) return;
            var json = JsonConvert.SerializeObject(new { t = type, d = payload });
            _ = _socket.SendText(json);
        }

        public void On(string type, Action<JObject> handler)
        {
            if (!_handlers.TryGetValue(type, out var list))
                _handlers[type] = list = new List<Action<JObject>>();
            list.Add(handler);
        }

        public void Off(string type, Action<JObject> handler = null)
        {
            if (handler == null) { _handlers.Remove(type); return; }
            if (_handlers.TryGetValue(type, out var list)) list.Remove(handler);
        }

        private void Update()
        {
            // NativeWebSocket exige de pomper l'event loop sur le thread principal.
            _socket?.DispatchMessageQueue();

            if (State == SocketState.Connected && Time.unscaledTime - _lastPingTime > PingIntervalSeconds)
            {
                _lastPingTime = Time.unscaledTime;
                Emit("ping", new { at = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() });
            }
        }

        private void ScheduleReconnect()
        {
            if (_shutdownRequested) return;
            State = SocketState.Reconnecting;
            _reconnectAttempts++;
            var max = AppConfig.Current != null ? AppConfig.Current.SocketReconnectMaxDelaySeconds : 30f;
            var delay = Mathf.Min(Mathf.Pow(2f, _reconnectAttempts), max);
            StartCoroutine(DelayedConnect(delay));
        }

        private IEnumerator DelayedConnect(float seconds)
        {
            yield return new WaitForSecondsRealtime(seconds);
            if (!_shutdownRequested) _ = ConnectAsync();
        }

        private void OnDestroy()
        {
            if (Instance == this) Instance = null;
        }

        public static void ShutdownAll()
        {
            if (Instance == null) return;
            Instance._shutdownRequested = true;
            try { Instance._socket?.Close(); } catch { /* déjà fermé */ }
            Instance.State = SocketState.Disconnected;
        }
    }
}
