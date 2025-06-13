/* sd.config.js */
const StyleDictionary = require('style-dictionary');

/* ─── 1. Nombre kebab + sin tildes ───────────────────────── */
StyleDictionary.registerTransform({
  name: 'name/uni-kebab',
  type: 'name',
  transformer: (prop) =>
    prop.path
      .join('-')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase()
});

/* ─── 2. Radius & dimension como px ──────────────────────── */
StyleDictionary.registerTransform({
  name: 'size/borderRadius',
  type: 'value',
  matcher: (prop) =>
    ['borderRadius', 'dimension', 'size', 'radius'].includes(
      prop.original.type
    ),
  transformer: (prop) => `${prop.value}px`
});

/* ─── 3. Agrupa transforms para CSS ─────────────────────── */
StyleDictionary.registerTransformGroup({
  name: 'custom/css',
  transforms: [
    'attribute/cti',
    'name/uni-kebab',
    'size/borderRadius',
    'color/css'
  ]
});

module.exports = {
  source: ['tokens/**/*.json'],

  platforms: {
    css: {
      buildPath: 'build/css/',
      transformGroup: 'custom/css',
      files: [
        {
          destination: 'variables.css',
          format: 'css/variables',
          options: { outputReferences: true }
        }
      ]
    },
    js: {
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
