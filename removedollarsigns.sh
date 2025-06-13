#!/usr/bin/env bash
set -euo pipefail           # (opcional) paranoia extra

for f in tokens/*.json; do
  echo "Processing $f"
  #        ↓↓↓↓↓↓↓↓↓↓↓↓↓   ¡LAS COMILLAS SON LA CLAVE!
  sed -i 's/\$//g' "$f"
done

