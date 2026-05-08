const fs = require('fs');
const path = require('path');
const { PurgeCSS } = require('purgecss');

const rootDir = path.resolve(__dirname, '..');
const outputFile = path.join(rootDir, 'styles.home.purged.css');
const safelist = ['active', 'hidden', 'success', 'error', 'visible', 'up', 'down', 'mela-purple'];

async function buildHomeCss() {
  process.chdir(rootDir);

  const result = await new PurgeCSS().purge({
    content: ['index.html', 'script.js'],
    css: ['styles.css', 'styles.home.source.css'],
    safelist: {
      standard: safelist,
    },
  });

  fs.writeFileSync(outputFile, result.map((entry) => entry.css).join('\n'), 'utf8');
}

buildHomeCss().catch((error) => {
  console.error(error);
  process.exit(1);
});