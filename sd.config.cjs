const path  = require('path');
const glob  = require('glob');
const StyleDictionary = require('style-dictionary');

/* -------- helper -------- */
const kebab = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                     .replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'')
                     .toLowerCase();

/* -------- 1. Detecta colección y modo ---------------------------------- */
/*  Ej. "SEMANTIC COLORS.Asia Verdezul.json"
           → collection = "SEMANTIC COLORS"
           → mode       = "Asia Verdezul"           */
StyleDictionary.registerTransform({
  name: 'attribute/collection-mode',
  type: 'attribute',
  transformer(token) {
    const [, collection, maybeMode] =
      path.basename(token.filePath).match(/^(.+?)\.(.+?)\.json$/) || [];
    token.attributes = {
      ...token.attributes,
      collection,
      ...(maybeMode && { mode: maybeMode })
    };
    return token.attributes;
  }
});

/* -------- 2. Otros transforms (kebab, radius…) ------------------------- */
StyleDictionary.registerTransform({
  name: 'name/kebab',
  type: 'name',
  transformer: prop => kebab(prop.path.join('-'))
});
StyleDictionary.registerTransform({
  name: 'size/radius',
  type: 'value',
  matcher: p => ['borderRadius','dimension','size','radius']
                   .includes((p.original.type||'').toLowerCase()),
  transformer: p => `${p.value}px`
});
StyleDictionary.registerTransformGroup({
  name: 'custom/css',
  transforms: [
    'attribute/collection-mode',
    'attribute/cti',
    'name/kebab',
    'size/radius',
    'color/css'
  ]
});

/* -------- 3. Construye plataformas colección×modo ---------------------- */
const config = { source: ['tokens/**/*.json'], platforms: {} };

/*  🔍 Recoge pares únicos (colección, modo) de todos los JSON */
const pairs = new Set(
  glob.sync('tokens/**/*.json').map(f => {
    const [, col, mode] = path.basename(f).match(/^(.+?)\.(.+?)\.json$/) || [];
    return col ? `${col}||${mode||''}` : '';      // "Spacing||" (sin modo)
  }).filter(Boolean)
);

pairs.forEach(pair => {
  const [collection, mode] = pair.split('||');
  const colId  = kebab(collection);              // semantic-colors
  const modeId = mode ? kebab(mode) : 'base';    // asia-verdezul / base
  const platId = `css-${colId}-${modeId}`;

  config.platforms[platId] = {
    buildPath: `build/css/${colId}/`,
    transformGroup: 'custom/css',
    files: [{
      destination: `${modeId}.css`,              // asia-verdezul.css o base.css
      format: 'css/variables',
      filter: t =>
        t.attributes.collection === collection &&
        (mode ? t.attributes.mode === mode : !t.attributes.mode),
      options: { outputReferences: true }
    }]
  };
});

module.exports = config;
