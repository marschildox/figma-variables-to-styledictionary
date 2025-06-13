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

/* 1️⃣ recorre **todos** los JSON de tokens/ ------------------------------ */
glob.sync('tokens/**/*.json').forEach(fullPath => {
  const { name } = path.parse(fullPath);                // ej. "SEMANTIC COLORS.Asia Verdezul"
  const [rawCol, rawMode = 'base'] = name.split('.');

  const colId  = kebab(rawCol);                         // semantic-colors
  const modeId = kebab(rawMode);                        // asia-verdezul | base
  const outDir = `build/css/${colId}/`;

  /* 2️⃣ extiende SD cargando **todos** los tokens ----------------------- */
  StyleDictionary.extend({
    source: ['tokens/**/*.json'],
    platforms: {
      css: {
        transformGroup: 'custom/css',
        buildPath: outDir,
        files: [{
          destination: `${modeId}.css`,
          format: 'css/variables',

          /* 🔑 filtra:
             a) tokens cuyo filePath es EXACTAMENTE este JSON
             b) alias que hagan referencia a tokens de este JSON          */
          filter: token => {
            const sameFile = path.resolve(token.filePath) === path.resolve(fullPath);

            if (sameFile) return true;                      // caso (a)

            // ----- caso (b): alias -----
            if (token.original && typeof token.original.value === 'string') {
              // coincidimos por "<colección>.<modo>" en la reference
              const referenceKey = `${rawCol}.${rawMode}`;
              return token.original.value.includes(referenceKey);
            }
            return false;
          },

          options: { outputReferences: true, includeEmpty: true }
        }]
      }
    }
  }).buildAllPlatforms();

  console.log(`✔︎  ${fullPath} → ${outDir}${modeId}.css`);
});

console.log('🏁  Build terminado – 1 CSS por JSON (con alias resueltos)');
