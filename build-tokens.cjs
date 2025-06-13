/* build-tokens.cjs  ────────────────────────────────────────────────────── */
const path   = require('path');
const glob   = require('glob');
const fs     = require('fs');
const rimraf = require('rimraf');

/* ─── 0. Limpiamos la salida de builds anteriores ─────────────────────── */
rimraf.sync('build');

/* ─── 1. Helper ─ kebab sin tildes ni espacios ────────────────────────── */
const kebab = s => s.normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'')
  .replace(/[^a-zA-Z0-9]+/g,'-')
  .replace(/^-|-$/g,'')
  .toLowerCase();

/* ─── 2. Localizamos todos los JSON de tokens ─────────────────────────── */
const TOKEN_FILES      = glob.sync('tokens/**/*.json');
const PRIMITIVE_FILES  = TOKEN_FILES.filter(f => /primitives?/i.test(f));

/* ─── 3. Recorremos **cada** fichero de tokens -------------------------- */
for (const fullPath of TOKEN_FILES) {

  /* 3.1 📛 Nombre de colección y modo a partir del nombre del fichero */
  const { name } = path.parse(fullPath);                   // p.e.  "SEMANTIC COLORS.Asia Verdezul"
  const [rawCol, rawMode = 'base'] = name.split('.');      // ["SEMANTIC COLORS", "Asia Verdezul"]

  const colId  = kebab(rawCol);                            // "semantic-colors"
  const modeId = kebab(rawMode);                           // "asia-verdezul" | "base"

  /* 3.2 📂 Dónde quedará el CSS resultante */
  const outDir = `build/css/${colId}/`;
  fs.mkdirSync(outDir, { recursive: true });

  /* 3.3 📄 Qué fuentes carga Style-Dictionary para ESTA iteración
         ─────────────────────────────────────────────────────────────
         ·  siempre → el fichero que estamos procesando
         ·  más los primitives → por si usa alias hacia allí           */
  const sources = [fullPath, ...PRIMITIVE_FILES];

  /* 3.4 🆕 Cargamos Style-Dictionary de cero en cada vuelta
         (borramos del cache para que no arrastre colisiones previas)     */
  delete require.cache[require.resolve('style-dictionary')];
  const StyleDictionary = require('style-dictionary').extend({

    source: sources,

    /* 3.4.1 Transforms y grupo custom (solo una vez la primera vuelta) */
    transform: {},
    platforms: {
      css: {
        transformGroup: 'custom/css',
        buildPath: outDir,
        files: [{
          destination: `${modeId}.css`,
          format:      'css/variables',
          /* solo tokens cuyo **filePath** sea el actual
             (los primitives se quedan para resolver alias, no se exportan) */
          filter: token => path.resolve(token.filePath) === path.resolve(fullPath),
          options: { outputReferences: true }
        }]
      }
    }
  });

  /* 3.5 Registramos (si no lo estaban ya) transforms comunes */
  if (!StyleDictionary.transform['name/kebab']) {
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
  }

  /* 3.6 🚀 Build sólo la plataforma CSS */
  StyleDictionary.buildPlatform('css');
  console.log(`✔︎  ${colId}/${modeId}.css generado`);
}

console.log('\n🏁  Build completo – un CSS por cada modo sin colisiones');
