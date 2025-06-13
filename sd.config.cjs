/* sd.config.cjs  ⇢  usa .cjs para que style-dictionary (CJS) pueda requerirlo */
const fs   = require('fs');
const path = require('path');
const StyleDictionary = require('style-dictionary');

/* ───────────── 1. MODO a partir del nombre de archivo ───────────── */
StyleDictionary.registerTransform({
  name: 'attribute/mode-from-path',
  type: 'attribute',
  transformer(token) {
    // …/tokens/SEMANTIC COLORS.Asia Verdezul.json  →  "Asia Verdezul"
    const match = token.filePath.match(/\.([^.]+)\.json$/);
    if (match) token.attributes = { ...token.attributes, mode: match[1] };
    return token.attributes;
  }
});

/* ───────────── 2. Nombre kebab + sin tildes ───────────── */
StyleDictionary.registerTransform({
  name: 'name/uni-kebab',
  type: 'name',
  transformer: prop =>
    prop.path
      .join('-')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // quita tildes
      .replace(/[^a-zA-Z0-9]+/g, '-')                   // espacios, ':' …
      .replace(/^-|-$/g, '')                            // trims
      .toLowerCase()
});

/* ───────────── 3. Radius & dimension como px ───────────── */
StyleDictionary.registerTransform({
  name: 'size/borderRadius',
  type: 'value',
  matcher: prop =>
    ['borderRadius', 'dimension', 'size', 'radius'].includes(prop.original.type),
  transformer: prop => `${prop.value}px`
});

/* ───────────── 4. Agrupa transforms ───────────── */
StyleDictionary.registerTransformGroup({
  name: 'custom/css',
  transforms: [
    'attribute/mode-from-path',  // ①  primero sacamos el modo
    'attribute/cti',
    'name/uni-kebab',
    'size/borderRadius',
    'color/css'
  ]
});

/* ───────────── 5. Config base ───────────── */
const config = {
  source: ['tokens/**/*.json'],
  platforms: {
    /* Otras plataformas que no dependen del modo */
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

/* ───────────── 6. Descubre los modos presentes y crea
                  una plataforma CSS por cada uno ───────────── */
const modeSet = new Set();

// Recorremos todos los JSON bajo tokens/
fs.readdirSync(path.resolve(__dirname, 'tokens')).forEach(file => {
  const m = file.match(/\.([^.]+)\.json$/);
  if (m) modeSet.add(m[1]);
});

modeSet.forEach(mode => {
  const kebab = mode.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  config.platforms[`css-${kebab}`] = {
    buildPath: `build/css/${kebab}/`,
    transformGroup: 'custom/css',
    files: [{
      destination: `variables-${kebab}.css`,
      format: 'css/variables',
      filter: token => token.attributes.mode === mode,
      options: { outputReferences: true }
    }]
  };
});

module.exports = config;
