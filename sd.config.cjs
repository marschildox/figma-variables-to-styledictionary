/* sd.config.cjs  (añade o cambia sólo las partes marcadas) */
const path  = require('path');
const glob  = require('glob');
const StyleDictionary = require('style-dictionary');

/* helper -------------------------------------------------- */
const kebab = s =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
   .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();

/* 1 ▸ atributo mode sólo para SEMANTIC COLORS -------------- */
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

/* 2 ▸ name / radius transforms … (igual que antes) --------- */
StyleDictionary.registerTransform({ /* name/uni-kebab … */ });
StyleDictionary.registerTransform({ /* size/borderRadius … */ });

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

/* 3 ▸ config base ------------------------------------------ */
const config = {
  source: ['tokens/**/*.json'],
  platforms: {
    js:  { /* … */ },
    ios: { /* … */ }
  }
};

/* 4 ▸ crea una plataforma por cada modo ─ ahora el filtro     */
/*     incluye ➊ tokens del modo Y ➋ tokens sin mode          */
const files = glob.sync('tokens/**/SEMANTIC COLORS.*.json', { nocase: true });
const modes = new Set(
  files.map(f => path.basename(f).match(/SEMANTIC COLORS\.([^.]+)\.json$/i)[1])
);

modes.forEach(mode => {
  const id = kebab(mode);
  config.platforms[`css-${id}`] = {
    buildPath: `build/css/${id}/`,
    transformGroup: 'custom/css',
    files: [{
      destination: `variables-${id}.css`,
      format: 'css/variables',
      /*  ⬇︎ Nuevo filtro: tokens con ese modo 𝘰 SIN modo  */
      filter: t => !t.attributes.mode || t.attributes.mode === mode,
      options: { outputReferences: true, outputReferencesDeep: true }
    }]
  };
});

/* 5 ▸ archivo global con TODO (opcional) -------------------- */
config.platforms['css-base'] = {
  buildPath: 'build/css/',
  transformGroup: 'custom/css',
  files: [{
    destination: 'variables.css',
    format: 'css/variables',
    options: { outputReferences: true, outputReferencesDeep: true }
  }]
};

module.exports = config;
