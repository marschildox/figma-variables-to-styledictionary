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

/* 1️⃣  recorre **todos** los JSON de tokens/ ----------------------------- */
glob.sync('tokens/**/*.json').forEach(fullPath => {
  const { dir, name } = path.parse(fullPath);            // p. ej. dir="tokens", name="SEMANTIC COLORS.Asia Verdezul"
  const [rawCol, rawMode = 'base'] = name.split('.');

  const colId  = kebab(rawCol);                          // semantic-colors
  const modeId = kebab(rawMode);                         // asia-verdezul  | base
  const outDir = `build/css/${colId}/`;

  /* 2️⃣  extiende SD cargando TODOS los tokens --------------------------- */
  StyleDictionary.extend({
    source: ['tokens/**/*.json'],
    platforms: {
      css: {
        transformGroup: 'custom/css',
        buildPath: outDir,
        files: [{
          destination: `${modeId}.css`,
          format: 'css/variables',

          /* 🔑 solo tokens cuyo **filePath** es EXACTAMENTE el que procesamos */
          filter: token => path.resolve(token.filePath) === path.resolve(fullPath),

          options: { outputReferences: true, includeEmpty: true }
        }]
      }
    }
  }).buildAllPlatforms();

  console.log(`✔︎  ${fullPath} → ${outDir}${modeId}.css`);
});

console.log('🏁  Build terminado – 1 CSS por JSON');
