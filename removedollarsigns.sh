#!/usr/bin/env bash
set -euo pipefail

# Recorre TODOS los JSON dentro de tokens/, en cualquier subcarpeta
find tokens -type f -name '*.json' -print0 | while IFS= read -r -d '' file
do
  echo "Processing $file"
  #          ↓↓↓↓↓↓↓↓↓↓↓↓↓  (comillas imprescindibles)
  sed -i 's/\$//g' "$file"
done
