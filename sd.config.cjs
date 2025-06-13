/* sd.config.cjs ───────────────────────────────────────────────────────────
   • Gana todos los modos de SEMANTIC COLORS.<Modo>.json
   • Genera build/css/<modo>/variables-<modo>.css
   • Mantiene plataformas JS & iOS
   • Listo para Style Dictionary v3.x
─────────────────────────────────────────────────────────────────────────── */
const path  = require('path');
const glob  = require('glob');           // ya viene transitiva en style-dictionary
const StyleDictionary = require('style-dictionary');

/*---------------------------------------------------------------------------
  Helpers
---------------------------------------------------------------------------*/
const kebab = str =>
  str
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')       // tildes → fuera
    .replace(/[^a-zA-Z0-9]+/g, '-')                        // separadores → -
    .replace(/^-|-$/g, '')                                 // trim guiones
    .toLowerCase();

/*---------------------------------------------------------------------------
  1 ▸ mode/attribute – solo para ficheros "SEMANTIC COLORS.<Modo>.json"
---------------------------------------------------------------------------*/
StyleDictionary.registerTransform({
  name: 'attribute/mode-from-semantic',
  type: 'attribute',
  matcher: t => /SEMANTIC COLORS\./i.test(path.basename(t.filePath)),
  transformer(t) {
    const [, mode] = path.basename(t.filePath)
                         .match(/SEMANTIC COLORS\.([^.]+)\.json$/i);
    t.attributes = { ...t.attributes, mode };
    return t.attributes;
  }
});

/*---------------------------------------------------------------------------
  2 ▸ name/kebab + sin acentos
---------------------------------------------------------------------------*/
StyleDictionary.registerTransform({
  name: 'name/uni-kebab',
  type: 'name',
  transformer: prop => kebab(prop.path.join('-'))
});

/*---------------------------------------------------------------------------
  3 ▸ borderRadius / dimension → px
---------------------------------------------------------------------------*/
StyleDictionary.registerTransform({
  name: 'size/borderRadius',
  type: 'value',
  matcher: p =>
    ['borderradius', 'dimension', 'size', 'radius']
      .includes((p.original.type || '').toLowerCase()),
  transformer: p => `${p.value}px`
});

/*---------------------------------------------------------------------------
  4 ▸ Agrupación personalizada para CSS
---------------------------------------------------------------------------*/
StyleDictionary.registerTransformGroup({
  name: 'custom/css',
  transforms: [
    'attribute/mode-from-semantic',
    'attribute/cti',
    'name/uni-kebab',
    'size/borderRadius',
    'color/css'
  ]
});

/*---------------------------------------------------------------------------
  5 ▸ Config base (plataformas comunes)
---------------------------------------------------------------------------*/
const config = {
  source: ['tokens/**/*.json'],
  platforms: {
    js: {
      buildPath: 'build/js/',
      transformGroup: 'scss',
      files: [
        { destination: 'colorpalette.js', format: 'javascript/es6' }
      ]
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
    /* Las plataformas CSS por modo se añaden dinámicamente debajo */
  }
};

/*---------------------------------------------------------------------------
  6 ▸ Descubre todos los modos presentes y crea plataformas CSS
---------------------------------------------------------------------------*/
const files = glob.sync('tokens/**/SEMANTIC COLORS.*.json', { nocase: true });
const modes = Array.from(
  new Set(
    files.map(f =>
      path.basename(f).match(/SEMANTIC COLORS\.([^.]+)\.json$/i)[1]
    )
  )
);

modes.forEach(mode => {
  const id = kebab(mode);                             // ej. "asia-verdezul"
  config.platforms[`css-${id}`] = {
    buildPath: `build/css/${id}/`,
    transformGroup: 'custom/css',
    files: [
      {
        destination: `variables-${id}.css`,
        format: 'css/variables',
        filter: t => t.attributes.mode === mode,      // solo tokens de ese modo
        options: { outputReferences: true }
      }
    ]
  };
});

module.exports = config;
