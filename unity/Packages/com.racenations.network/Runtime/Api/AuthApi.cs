using System;
using System.Collections;
using Newtonsoft.Json;
using RaceNations.Core;
using UnityEngine;

namespace RaceNations.Network
{
    [JsonObject(MemberSerialization.OptIn)]
    public class LoginRequest
    {
        [JsonProperty("email")] public string Email;
        [JsonProperty("password")] public string Password;
    }

    [JsonObject(MemberSerialization.OptIn)]
    public class RegisterRequest
    {
        [JsonProperty("email")] public string Email;
        [JsonProperty("password")] public string Password;
        [JsonProperty("countryCode")] public string CountryCode; // résidence — gating juridiction (INV-20)
    }

    [JsonObject(MemberSerialization.OptIn)]
    public class AuthTokensResponse
    {
        [JsonProperty("accessToken")] public string AccessToken;
        [JsonProperty("refreshToken")] public string RefreshToken;
        [JsonProperty("expiresIn")] public int ExpiresIn;
    }

    /// <summary>
    /// Flux d'authentification côté client : login/register → tokens placés en SecureStore
    /// (jamais en clair), Bearer injecté dans ApiClient, refresh rotation (le backend
    /// invalide l'ancien refresh à chaque usage — docs/backend/auth.md), restauration de
    /// session au boot. Toute réponse 401 sur le refresh déclenche un logout local net.
    /// API callback-based pour rester alignée avec les coroutines UnityWebRequest.
    /// </summary>
    public static class AuthApi
    {
        public static event Action OnLoggedOut;

        public static void Login(string email, string password, Action<bool> onDone)
        {
            var body = new LoginRequest { Email = email, Password = password };
            ApiClient.Instance.PostAsync<AuthTokensResponse>("v1/auth/login", body, null, res =>
            {
                if (res.Success && res.Data != null && !string.IsNullOrEmpty(res.Data.AccessToken))
                {
                    Store(res.Data);
                    onDone?.Invoke(true);
                }
                else
                {
                    Log.Warn($"[AuthApi] login KO {(res.ErrorCode ?? res.ErrorMessage)}");
                    onDone?.Invoke(false);
                }
            });
        }

        public static void Register(string email, string password, string countryCode, Action<bool> onDone)
        {
            var body = new RegisterRequest { Email = email, Password = password, CountryCode = countryCode };
            // Clé d'idempotence : un double-clic sur "S'inscrire" ne crée pas deux comptes.
            var idem = Guid.NewGuid().ToString("N");
            ApiClient.Instance.PostAsync<AuthTokensResponse>("v1/auth/register", body, idem, res =>
            {
                if (res.Success && res.Data != null)
                {
                    Store(res.Data);
                    onDone?.Invoke(true);
                }
                else onDone?.Invoke(false);
            });
        }

        /// <summary>Coroutine de refresh — utilisée par ApiClient sur 401 et par RestoreSession.</summary>
        public static IEnumerator RefreshOnce(Action<bool> onDone)
        {
            var refresh = SecureStore.GetString(SecureStore.RefreshKey);
            if (string.IsNullOrEmpty(refresh))
            {
                onDone?.Invoke(false);
                yield break;
            }

            bool done = false, ok = false;
            var body = new { refreshToken = refresh };
            // POST + clé d'idempotent jetable : le serveur gère la rotation lui-même.
            ApiClient.Instance.PostAsync<AuthTokensResponse>("v1/auth/refresh", body,
                Guid.NewGuid().ToString("N"), res =>
                {
                    done = true;
                    if (res.Success && res.Data != null) { Store(res.Data); ok = true; }
                    else { Logout(); }
                });

            while (!done) yield return null;
            onDone?.Invoke(ok);
        }

        /// <summary>Au boot : charge le token sécurisé, le re-valide via /auth/me, refresh si 401.</summary>
        public static IEnumerator RestoreSessionOrNull()
        {
            var access = SecureStore.GetString(SecureStore.AccessKey);
            if (string.IsNullOrEmpty(access)) yield break;

            ApiClient.Instance.AccessToken = access;
            bool done = false, valid = false;
            ApiClient.Instance.GetAsync<object>("v1/auth/me", res =>
            {
                done = true;
                valid = res.Success;
                if (res.StatusCode == 401) return;
            });
            while (!done) yield return null;

            if (!valid)
            {
                bool refreshed = false;
                yield return RefreshOnce(ok => refreshed = ok);
                if (!refreshed) Logout();
            }
        }

        public static void Logout()
        {
            ApiClient.Instance.AccessToken = null;
            SecureStore.PurgeAuth();
            OnLoggedOut?.Invoke();
        }

        public static bool IsLoggedIn => !string.IsNullOrEmpty(SecureStore.GetString(SecureStore.AccessKey));

        private static void Store(AuthTokensResponse tokens)
        {
            ApiClient.Instance.AccessToken = tokens.AccessToken;
            SecureStore.SetString(SecureStore.AccessKey, tokens.AccessToken);
            SecureStore.SetString(SecureStore.RefreshKey, tokens.RefreshToken);
        }
    }
}
