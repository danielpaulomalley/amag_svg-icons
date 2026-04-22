import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { optimize } from 'svgo';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const svgDir = path.join(__dirname, 'raw-svgs');
const outputDir = path.join(__dirname, 'src', 'icons');
const indexFile = path.join(__dirname, 'src', 'index.ts');

function toExportName(filename) {
  // trash-04 -> amTrash04, dots-horizontal -> amDotsHorizontal, editAlt -> amEditAlt
  const base = path.parse(filename).name;
  const camel = base.replace(/[-_](.)/g, (_, c) => c.toUpperCase());
  return 'am' + camel.charAt(0).toUpperCase() + camel.slice(1);
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const svgFiles = fs.readdirSync(svgDir).filter(f => f.endsWith('.svg')).sort();
const exports = [];

svgFiles.forEach(file => {
  const iconName = path.parse(file).name;
  const exportName = toExportName(file);

  const raw = fs.readFileSync(path.join(svgDir, file), 'utf-8');
  const result = optimize(raw, {
    path: file,
    multipass: true,
    plugins: [
      { name: 'preset-default' },
      'removeDimensions',
      { name: 'convertColors', params: { currentColor: true } },
    ],
  });
  const svgData = result.data.replace(/'/g, "\\'");

  const content =
    `// Auto-generated. Do not edit directly.\n` +
    `import type { AmagIconDefinition } from '@amag/icon-library';\n\n` +
    `export const ${exportName}: AmagIconDefinition = {\n` +
    `  iconName: '${iconName}',\n` +
    `  data: '${svgData}',\n` +
    `};\n`;

  fs.writeFileSync(path.join(outputDir, `${exportName}.ts`), content);
  exports.push(exportName);
});

// Write src/index.ts
const indexContent =
  `// Auto-generated. Do not edit directly.\n` +
  exports.map(e => `export { ${e} } from './icons/${e}';`).join('\n') +
  '\n';

fs.writeFileSync(indexFile, indexContent);

console.log(`Generated ${svgFiles.length} icons into src/icons/`);
