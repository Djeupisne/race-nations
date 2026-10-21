#!/usr/bin/env bash
# Race Nations — Build du serveur headless Unity (scene ServerBoot.unity, target Linux).
# Si le licence/éditeur Unity est absent, bascule sur une préparation vérifiée du projet (dry-run).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/build/server"
UNITY_BIN="${UNITY_EDITOR_PATH:-}"

mkdir -p "$OUT"

if [ -n "$UNITY_BIN" ] && [ -x "$UNITY_BIN" ]; then
  echo "==> Build Unity headless via $UNITY_BIN"
  "$UNITY_BIN" -quit -batchmode -nographics \
    -projectPath "$ROOT/unity" \
    -buildTarget Linux64 \
    -executeMethod Editor.BuildScripts.BuildServer \
    -serverBuildOutput "$OUT" \
    -logFile "$OUT/build.log"
  test -s "$OUT/RaceNationsServer.x86_64" || { echo "Échec : binaire serveur absent."; exit 1; }
  echo "==> Serveur prêt : $OUT/RaceNationsServer.x86_64"
else
  echo "==> UNITY_EDITOR_PATH non défini : préparation du build (vérifications) — pas de compilation."
  for f in \
    unity/Assets/_Project/Scenes/ServerBoot.unity \
    unity/Packages/com.racenations.server/Runtime/ServerBootstrap.cs \
    unity/Packages/com.racenations.server/Runtime/RaceServerManager.cs \
    unity/Packages/com.racenations.server/Runtime/ServerValidation.cs; do
    [ -s "$ROOT/$f" ] && echo "   OK  $f" || { echo "   MANQUE/VIDE  $f"; FAILED=1; }
  done
  [ "${FAILED:-0}" = "1" ] && exit 1
  cat > "$OUT/BUILD_INSTRUCTIONS.md" <<'MD'
# Build du serveur headless
1. Ouvrir `unity/` dans l'éditeur Unity (LTS 2022.3+).
2. Ajouter la scène `Assets/_Project/Scenes/ServerBoot.unity` aux scènes du build.
3. Menu *Race Nations → Build Server (Linux64)* ou CLI :
   `Unity -batchmode -nographics -projectPath unity -executeMethod Editor.BuildScripts.BuildServer -buildTarget Linux64`
4. Lancer avec : `./RaceNationsServer.x86_64 -batchmode -nographics -serverConfig json:{...}`
MD
  echo "==> Instructions écrites dans $OUT/BUILD_INSTRUCTIONS.md"
fi
