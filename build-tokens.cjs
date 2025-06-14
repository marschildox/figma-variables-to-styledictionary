/**
 * build-tokens.cjs
 *
 * Genera:
 *   build/css/<colección-kebab>/<modo-kebab>.css
 *   (si el JSON no tiene modo → …/base.css)
 *
 * Estrategia:
 *   • Recorre CADA JSON de /tokens
 *   • Carga ese JSON + todos los ficheros de soporte (primitives, radios…)
 *   • Exporta solo los tokens cuyo filePath es ese JSON
 *   • Usa transforms kebab & radius→px
 */

const path  = require('path');
const glob  = require('glob');
const rimraf = require('rimraf');
const StyleDictionary = require('style-dictionary');

/* 🧹 limpia build/ antes de empezar */
rimraf.sync('build');

/* helper – kebab sin tildes --------------------------------------------- */
const kebab = str =>
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
     .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '')
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
    ['borderradius', 'dimension', 'size', 'radius']
      .includes((p.original.type || '').toLowerCase()),
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

/* 🗂️  ficheros que siempre se añaden para resolver alias  ---------------- */
const SUPPORT_FILES = glob
  .sync('tokens/**/*.json', { nocase: true })
  .filter(f =>
    /primitives?/i.test(f)        ||   // color-primitives, radius-primitives…
    /border radius/i.test(f)      ||   // Border Radius base
    /dimensions/i.test(f)         ||   // Dimensions base (si lo tuvieras)
    /spacing/i.test(f)                 // Spacing base (opcional)
  );

/* 🚀  procesa cada JSON de /tokens --------------------------------------- */
glob.sync('tokens/**/*.json').forEach(fullPath => {

  const { name }         = path.parse(fullPath);      // p.ej. "SEMANTIC COLORS.Asia Verdezul"
  const [rawCol, rawMod] = name.split('.');
  const colId  = kebab(rawCol);                       // "semantic-colors"
  const modId  = kebab(rawMod || 'base');             // "asia-verdezul" | "base"

  const sources = [fullPath, ...SUPPORT_FILES];

  /* instancia aislada de SD (sin colisiones) */
  StyleDictionary.extend({
    source: sources,
    platforms: {
      css: {
        transformGroup: 'custom/css',
        buildPath: `build/css/${colId}/`,
        files: [{
          destination: `${modId}.css`,
          format: 'css/variables',
          /* exporta solo tokens definidos en este archivo */
          filter: t => path.resolve(t.filePath) === path.resolve(fullPath),
          options: { outputReferences: true, includeEmpty: true }
        }]
      }
    }
  }).buildPlatform('css');

  console.log(`✔︎  ${colId}/${modId}.css generado`);
});

console.log('\n🏁  Build completo – 1 CSS por cada JSON');
