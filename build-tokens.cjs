/* build-tokens.cjs  ─ genera
       build/css/<colección-kebab>/<modo-kebab>.css
   cargando TODOS los JSON, por lo que las referencias se resuelven        */

const path = require('path');
const fs   = require('fs');
const glob = require('glob');
const StyleDictionary = require('style-dictionary');

/* helper ─ kebab + sin tildes ------------------------------------------- */
const kebab = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
                   .replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'')
                   .toLowerCase();

/* transforms comunes ---------------------------------------------------- */
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

/* 1️⃣  recopila cada (colección, modo) único ---------------------------- */
const pairs = new Set(
  glob.sync('tokens/**/*.json').map(f => {
    const { name } = path.parse(f);        // "SEMANTIC COLORS.Asia Verdezul"
    const [col, mode = 'base'] = name.split('.');
    return `${col}||${mode}`;              // → "SEMANTIC COLORS||Asia Verdezul"
  })
);

/* 2️⃣  construye una plataforma por pareja ------------------------------ */
pairs.forEach(pair => {
  const [rawCol, rawMode] = pair.split('||');
  const colId  = kebab(rawCol);           // semantic-colors
  const modeId = kebab(rawMode);          // asia-verdezul | base

  StyleDictionary.extend({
    source: ['tokens/**/*.json'],         // <-- carga TODOS los tokens
    platforms: {
      css: {
        transformGroup: 'custom/css',
        buildPath: `build/css/${colId}/`,
        files: [{
          destination: `${modeId}.css`,
          format: 'css/variables',
          /* escribe solo los tokens cuyo archivo sea esa colección + modo */
          filter: token => {
            const { name } = path.parse(token.filePath);
            const [fileCol, fileMode = 'base'] = name.split('.');
            return fileCol === rawCol && fileMode === rawMode;
          },
          options: { outputReferences: true, includeEmpty: true }
        }]
      }
    }
  }).buildAllPlatforms();
});

console.log('✅  Build terminado — carpetas por colección + modo');
