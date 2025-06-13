/* sd.config.cjs ------------------------------------------------------------ */
const fs   = require('fs');
const path = require('path');
const StyleDictionary = require('style-dictionary');

/* ──────────────────────────────── 1. helper ─────────────────────────────── */
const kebab = str =>
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '') // tildes fuera
     .replace(/[^a-zA-Z0-9]+/g, '-')                  // sep → guión
     .replace(/^-|-$/g, '')                           // trims
     .toLowerCase();

/* ───── 2. Transform: añade token.attributes.mode solo si proviene de
          un archivo 'SEMANTIC COLORS.<mode>.json' ────────────────────────── */
StyleDictionary.registerTransform({
  name: 'attribute/mode-from-semantic-colors',
  type: 'attribute',
  transformer(token) {
    const re = /SEMANTIC COLORS\.([^.]+)\.json$/i;
    const hit = token.filePath.match(re);
    if (hit) token.attributes = { ...token.attributes, mode: hit[1] };
    return token.attributes;
  }
});

/* ───── 3. Transform: kebab + sin tildes ─────────────────────────────────── */
StyleDictionary.registerTransform({
  name: 'name/uni-kebab',
  type: 'name',
  transformer: prop => kebab(prop.path.join('-'))
});

/* ───── 4. Transform: border radius → px ─────────────────────────────────── */
StyleDictionary.registerTransform({
  name: 'size/borderRadius',
  type: 'value',
  matcher: p => ['borderRadius', 'dimension', 'size', 'radius'].includes(p.original.type),
  transformer: p => `${p.value}px`
});

/* ───── 5. Agrupación personalizada ─────────────────────────────────────── */
StyleDictionary.registerTransformGroup({
  name: 'custom/css',
  transforms: [
    'attribute/mode-from-semantic-colors', // 👈 primero, saca el modo
    'attribute/cti',
    'name/uni-kebab',
    'size/borderRadius',
    'color/css'
  ]
});

/* ───── 6. Config base ───────────────────────────────────────────────────── */
const config = {
  source: ['tokens/**/*.json'],
  platforms: {
    js:  {
      buildPath: 'build/js/',
      transformGroup: 'scss',
      files: [{ destination: 'colorpalette.js', format: 'javascript/es6' }]
    },
    ios: {
      buildPath: 'build/ios/',
      transformGroup: 'ios-swift',
      files: [
        {
          destination: 'colorpalette.swift',
          format: 'ios-swift/any.swift',
          className: 'colorPalette',
          options: { outputReferences: true }
        },
        { destination: 'enum.swift', format: 'ios-swift/enum.swift' }
      ]
    }
  }
};

/* ───── 7. Descubre modos según SEMANTIC COLORS.*.json ───────────────────── */
const tokensDir = path.resolve(__dirname, 'tokens');
fs.readdirSync(tokensDir)
  .filter(fn => fn.startsWith('SEMANTIC COLORS.') && fn.endsWith('.json'))
  .forEach(fn => {
    const mode = fn.match(/^SEMANTIC COLORS\.([^.]+)\.json$/i)[1];
    const keb  = kebab(mode);

    config.platforms[`css-${keb}`] = {
      buildPath: `build/css/${keb}/`,
      transformGroup: 'custom/css',
      files: [{
        destination: `variables-${keb}.css`,
        format: 'css/variables',
        filter: token => token.attributes.mode === mode, // solo tokens de ese modo
        options: { outputReferences: true }
      }]
    };
  });

module.exports = config;
