#!/usr/bin/env bash
set -euo pipefail

# Recorre *cualquier* JSON dentro de tokens/, sin importar subcarpetas
find tokens -type f -name '*.json' -print0 | while IFS= read -r -d '' file
do
  echo "Processing $file"
  sed -i 's/\$//g' "$file"          # comillas ⇒ admite espacios, acentos, etc.
done
