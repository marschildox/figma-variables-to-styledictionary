const path  = require('path');
const glob  = require('glob');
const StyleDictionary = require('style-dictionary');

/* helper ─ kebab --------------------------------------------------------- */
const kebab = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
                   .replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'')
                   .toLowerCase();

/* transforms comunes ----------------------------------------------------- */
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

/* 🆕  lista con todos los JSON “primitives” (colores, radius, etc.) */
const PRIMITIVE_FILES = glob
  .sync('tokens/**/*.json', { nocase: true })
  .filter(f => /primitives?/i.test(f));

/* 1️⃣  recorre **todos** los JSON de tokens/ ----------------------------- */
glob.sync('tokens/**/*.json').forEach(fullPath => {
  const { name }         = path.parse(fullPath);            // "SEMANTIC COLORS.Asia Verdezul"
  const [rawCol, rawMode = 'base'] = name.split('.');

  const colId  = kebab(rawCol);                             // semantic-colors
  const modeId = kebab(rawMode);                            // asia-verdezul | base
  const outDir = `build/css/${colId}/`;

  /* 2️⃣  fuentes: este JSON + todos los primitives ----------------------- */
  const sources = [fullPath, ...PRIMITIVE_FILES];

  StyleDictionary.extend({
    source: sources,
    platforms: {
      css: {
        transformGroup: 'custom/css',
        buildPath: outDir,
        files: [{
          destination: `${modeId}.css`,
          format: 'css/variables',
          /* solo exporta los tokens que proceden de este archivo */
          filter: t => path.resolve(t.filePath) === path.resolve(fullPath),
          options: { outputReferences: true, includeEmpty: true }
        }]
      }
    }
  }).buildPlatform('css');

  console.log(`✔︎  ${colId}/${modeId}.css generado`);
});

console.log('🏁  Build completo – un CSS por cada JSON, sin referencias rotas');
