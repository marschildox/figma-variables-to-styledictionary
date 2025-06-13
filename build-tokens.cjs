/* build-tokens.cjs
   Ejecuta Style Dictionary 1 vez por cada JSON dentro de /tokens
   Resultado:
      build/css/<colección-kebab>/<modo-kebab>.css
      build/css/<colección-kebab>/base.css           (si no hay modo) */

const fs   = require('fs');
const path = require('path');
const StyleDictionary = require('style-dictionary');

/* ───── helpers ───── */
const kebab = str =>
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
     .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '')
     .toLowerCase();

/* ───── transforms comunes (kebab + radius → px) ───── */
StyleDictionary.registerTransform({
  name: 'name/kebab',
  type: 'name',
  transformer: prop => kebab(prop.path.join('-'))
});

StyleDictionary.registerTransform({
  name: 'size/radius',
  type: 'value',
  matcher: p =>
    ['borderradius','dimension','size','radius']
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

/* ─────  loop: procesa cada archivo de /tokens  ───── */
fs.readdirSync('tokens')
  .filter(fn => fn.endsWith('.json'))
  .forEach(file => {
    const { name } = path.parse(file);               // p.ej. "SEMANTIC COLORS.Kawaii"
    const [collectionRaw, modeRaw] = name.split('.');

    const collection = kebab(collectionRaw);         // semantic-colors
    const mode       = kebab(modeRaw || 'base');     // kawaii  | base

    StyleDictionary.extend({
      source: [`tokens/${file}`],
      platforms: {
        css: {
          transformGroup: 'custom/css',
          buildPath: `build/css/${collection}/`,
          files: [{
            destination: `${mode}.css`,
            format: 'css/variables',
            options: { outputReferences: true }
          }]
        }
      }
    }).buildAllPlatforms();
  });

console.log('✅  Style Dictionary build finished');
