using System;
using System.Security.Cryptography;
using System.Text;
using UnityEngine;

namespace RaceNations.Core
{
    /// <summary>
    /// Stockage local chiffré des tokens (JWT access/refresh).
    /// Les tokens ne sont JAMAIS en PlayerPrefs clair : DPAPI (ProtectedData) quand la
    /// plateforme le supporte, sinon AES-256 dont la clé est dérivée (PBKDF2) d'un sel
    /// aléatoire généré à la première exécution et stocké avec lui.
    /// Limitation assumée : protège contre la lecture naïve du fichier de préférences,
    /// pas contre une machine compromise ; la vraie défense reste le refresh rotation
    /// serveur (family id, docs/backend/auth.md).
    /// </summary>
    public static class SecureStore
    {
        private const string PrefPrefix = "rn.secure.";
        private const string SaltKey = "rn.secure.salt";
        private const int Iterations = 10000;

        public const string AccessKey = "auth.access";
        public const string RefreshKey = "auth.refresh";

        public static void SetString(string key, string value)
        {
            if (string.IsNullOrEmpty(value))
            {
                Delete(key);
                return;
            }
            var protectedBytes = Protect(Encoding.UTF8.GetBytes(value));
            PlayerPrefs.SetString(PrefPrefix + key, Convert.ToBase64String(protectedBytes));
            PlayerPrefs.Save();
        }

        public static string GetString(string key, string fallback = null)
        {
            var stored = PlayerPrefs.GetString(PrefPrefix + key, string.Empty);
            if (string.IsNullOrEmpty(stored)) return fallback;
            try
            {
                var raw = Convert.FromBase64String(stored);
                return Encoding.UTF8.GetString(Unprotect(raw));
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[SecureStore] lecture impossible ({e.Message}) — purge de '{key}'.");
                Delete(key);
                return fallback;
            }
        }

        public static void Delete(string key)
        {
            PlayerPrefs.DeleteKey(PrefPrefix + key);
            PlayerPrefs.Save();
        }

        public static void PurgeAuth()
        {
            Delete(AccessKey);
            Delete(RefreshKey);
        }

        // ---------------------------------------------------------------- crypto

        private static byte[] Protect(byte[] data)
        {
            try
            {
                return ProtectedData.Protect(data, GetSalt(), DataProtectionScope.CurrentUser);
            }
            catch (PlatformNotSupportedException)
            {
                return AesEncrypt(data); // Android/iOS/WebGL
            }
        }

        private static byte[] Unprotect(byte[] data)
        {
            try
            {
                return ProtectedData.Unprotect(data, GetSalt(), DataProtectionScope.CurrentUser);
            }
            catch (PlatformNotSupportedException)
            {
                return AesDecrypt(data);
            }
        }

        private static byte[] GetSalt()
        {
            var salt = PlayerPrefs.GetString(SaltKey, string.Empty);
            if (string.IsNullOrEmpty(salt))
            {
                salt = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
                PlayerPrefs.SetString(SaltKey, salt);
                PlayerPrefs.Save();
            }
            return Convert.FromBase64String(salt);
        }

        private static byte[] DeriveKey()
        {
            using var kdf = new Rfc2898DeriveBytes(
                GetSalt(), Encoding.UTF8.GetBytes("RaceNations.SecureStore.v1"), Iterations);
            return kdf.GetBytes(32); // AES-256
        }

        private static byte[] AesEncrypt(byte[] plain)
        {
            using var aes = Aes.Create();
            aes.Key = DeriveKey();
            aes.GenerateIV();
            using var enc = aes.CreateEncryptor();
            var cipher = enc.TransformFinalBlock(plain, 0, plain.Length);
            var result = new byte[aes.IV.Length + cipher.Length];
            Buffer.BlockCopy(aes.IV, 0, result, 0, aes.IV.Length);
            Buffer.BlockCopy(cipher, 0, result, aes.IV.Length, cipher.Length);
            return result;
        }

        private static byte[] AesDecrypt(byte[] blob)
        {
            using var aes = Aes.Create();
            aes.Key = DeriveKey();
            var iv = new byte[16];
            Buffer.BlockCopy(blob, 0, iv, 0, iv.Length);
            aes.IV = iv;
            using var dec = aes.CreateDecryptor();
            return dec.TransformFinalBlock(blob, iv.Length, blob.Length - iv.Length);
        }
    }
}
