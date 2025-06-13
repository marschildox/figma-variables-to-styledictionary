/* build-tokens.cjs -------------------------------------------------------- */
const path            = require('path');
const glob            = require('glob');
const StyleDictionary = require('style-dictionary');

/* ─── Util: convierte a kebab sin tildes ────────────────────────────────── */
const kebab = s => s
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9]+/g, '-')
  .replace(/^-|-$/g, '')
  .toLowerCase();

/* ─── Transforms comunes (solo se registran una vez) ───────────────────── */
StyleDictionary.registerTransform({
  name: 'name/kebab',
  type: 'name',
  transformer: p => kebab(p.path.join('-'))
});

StyleDictionary.registerTransform({
  name: 'size/radius',
  type: 'value',
  matcher: p =>
    ['borderradius', 'dimension', 'size', 'radius']
      .includes((p.original.type || '').toLowerCase()),
  transformer: p => `${p.value}px`
});

StyleDictionary.registerTransformGroup({
  name: 'custom/css',
  transforms: [
    'attribute/cti',
    'name/kebab',
    'size/radius',
    'color/css'
  ]
});

/* ─── 1. Recorre todos los JSON dentro de /tokens ──────────────────────── */
glob.sync('tokens/**/*.json').forEach(fullPath => {
  const { name }         = path.parse(fullPath);            // p.ej. "SEMANTIC COLORS.Asia Verdezul"
  const [rawCol, rawMod] = name.split('.');
  const colId  = kebab(rawCol);                             // semantic-colors
  const modId  = kebab(rawMod || 'base');                   // asia-verdezul | base
  const outDir = path.join('build/css', colId, '/');

  /* ─── 2. Carga SOLO ese fichero como fuente ⤵️ — así no hay colisiones ─ */
  StyleDictionary.extend({
    source: [fullPath],
    platforms: {
      css: {
        transformGroup: 'custom/css',
        buildPath: outDir,
        files: [{
          destination : `${modId}.css`,
          format      : 'css/variables',
          options     : { outputReferences: true, includeEmpty: true }
        }]
      }
    }
  }).buildAllPlatforms();

  console.log(`✔︎  ${fullPath} → ${outDir}${modId}.css`);
});

console.log('🏁  Build terminado — 1 CSS por JSON');
