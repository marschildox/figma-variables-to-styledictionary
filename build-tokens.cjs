/* build-tokens.cjs  ─ reescrito: 1 build por colección+modo,
   pero cargando SIEMPRE todos los tokens para que las referencias se resuelvan */

const fs   = require('fs');
const path = require('path');
const glob = require('glob');
const StyleDictionary = require('style-dictionary');

/* helpers -------------------------------------------------- */
const kebab = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                   .replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'')
                   .toLowerCase();

/* transforms (kebab, radius→px) ---------------------------- */
StyleDictionary.registerTransform({
  name: 'name/kebab',
  type: 'name',
  transformer: p => kebab(p.path.join('-'))
});
StyleDictionary.registerTransform({
  name: 'size/radius',
  type: 'value',
  matcher: p =>
    ['borderradius','dimension','size','radius']
      .includes((p.original.type||'').toLowerCase()),
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

/* ───── 1. Reúne (colección, modo) únicos ───── */
const pairs = new Set(
  glob.sync('tokens/*.json').map(f => {
    const [col, mode = 'base'] = path.parse(f).name.split('.');
    return `${col}||${mode}`;
  })
);

/* ───── 2. Para cada pareja, extiende SD ───── */
pairs.forEach(pair => {
  const [collectionRaw, modeRaw] = pair.split('||');
  const collection = kebab(collectionRaw);      // semantic-colors
  const mode       = kebab(modeRaw);            // kawaii | base

  StyleDictionary.extend({
    source: ['tokens/**/*.json'],               // 👈 todos los tokens
    platforms: {
      css: {
        transformGroup: 'custom/css',
        buildPath: `build/css/${collection}/`,
        files: [{
          destination: `${mode}.css`,
          format: 'css/variables',
          /* sólo escribe la colección & modo actuales */
          filter: token => {
            const [fileCol, fileMode = 'base'] =
              path.parse(token.filePath).name.split('.');
            return (
              fileCol === collectionRaw &&
              (modeRaw === 'base' ? fileMode === 'base' : fileMode === modeRaw)
            );
          },
          options: { outputReferences: true }
        }]
      }
    }
  }).buildAllPlatforms();
});

console.log('✅  Build terminado sin referencias rotas');
