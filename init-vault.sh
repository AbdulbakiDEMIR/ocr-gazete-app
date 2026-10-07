#!/usr/bin/env bash
set -euo pipefail

PROJECT_NAME="${1:-}"
if [ -z "$PROJECT_NAME" ]; then
  read -r -p "Yeni Projenin Adı: " PROJECT_NAME
fi
if [ -z "$PROJECT_NAME" ]; then
  echo "Proje adı boş bırakılamaz." >&2
  exit 1
fi

INDEX_PATH=".knowledge/index.md"
if [ ! -f "$INDEX_PATH" ]; then
  echo "$INDEX_PATH dosyası bulunamadı." >&2
  exit 1
fi

# sed yerine geçecek metindeki özel karakterleri (\ / &) kaçır.
ESCAPED_NAME=$(printf '%s' "$PROJECT_NAME" | sed -e 's/[\/&\\]/\\&/g')
sed -i.bak "s/{{PROJECT_NAME}}/${ESCAPED_NAME}/g" "$INDEX_PATH"
rm -f "$INDEX_PATH.bak"

echo "'$PROJECT_NAME' için bilgi grafiği başlatıldı. Sıradaki adım: AI asistanına 'Projeyi kuralım' diyerek onboarding'i başlat."
