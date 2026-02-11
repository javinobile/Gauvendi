const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const host = 'hopper.proxy.rlwy.net';
const port = 28241;
const username = 'root';
const password = '5M.BrvbVFxvG4WetmLZk0EBuZnhlcOvr';
const dbName = 'gvd_itf_apaleo_qa';
const dbFolder = dbName.replace(/^ibe_|^gvd_|_qa$|_prod$/g, '').replace('_', '-') + '-db';
const outputDir = `./src/connection-db/${dbFolder}/entities`;

const command = `npx typeorm-model-generator \
  -h ${host} \
  -p ${port} \
  -d ${dbName} \
  -u ${username} \
  -x ${password} \
  -e mariadb \
  -o ${outputDir} \
  --noConfig`;

console.log('🚀 Generating entities for database:', dbName);
exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.warn(`⚠️ Stderr: ${stderr}`);
  }
  const files = fs.readdirSync(outputDir).filter((f) => f.endsWith('.ts'));

  // Step 1: Fix content (broken default values, import casing, Buffer to string for binary(16))
  files.forEach((file) => {
    const fullPath = path.join(outputDir, file);
    let content = fs.readFileSync(fullPath, 'utf8');

    // 1.1 Change type from Buffer to string if @Column('binary', { length: 16 ... })
    // and the property is typed as Buffer
    // Handles both single-line and multi-line decorators

    // 1.2 Fix PascalCase imports to kebab-case
    // Also fix import casing for PascalCase files with underscores (e.g. HotelAmenity_Extra)
    content = content.replace(
      /import\s+{([^}]+)}\s+from\s+['"]\.\/([A-Z][A-Za-z0-9_]*?)['"]/g,
      (_, imports, fileName) => {
        // Convert PascalCase (with possible underscores) to kebab-case
        // e.g. HotelAmenity_Extra -> hotel-amenity_extra
        let kebab = fileName
          .replace(/([a-z0-9])([A-Z])/g, '$1-$2') // PascalCase to kebab
          .replace(/_/g, '_') // keep underscores as is
          .toLowerCase();
        return `import {${imports.trim()}} from "./${kebab}"`;
      }
    );

    // Add import if not exists
    if (!content.includes(`import { stringify } from 'uuid';`)) {
      content = `import { stringify } from 'uuid';\n` + content;
    }

    content = content.replace(
      /@Column\(\s*['"]binary['"],\s*{([\s\S]*?length:\s*16[\s\S]*?)}\)\s*(\w+):\s*Buffer(\s*\|\s*null)?;/g,
      (_, columnProps, propName, isNullable) => {
        const newProps = columnProps.trim().endsWith(',') ? columnProps : columnProps + ',';

        return `@Column('binary', {
${newProps}
  transformer: {
    from: (value) => value && stringify(value),
    to: (value) => value && Buffer.from(value.replace(/-/g, ''), 'hex'),
  },
})\n${propName}: ${isNullable ? 'string | null' : 'string'};`;
      }
    );

    content = content.replace(
      /@Column\(\s*['"]decimal['"],\s*{([\s\S]*?precision:\s*26[\s\S]*?)}\)\s*(\w+):\s*string(\s*\|\s*null)?;/g,
      (_, columnProps, propName, isNullable) => {
        return `@Column('decimal', {${columnProps.trim()} transformer: {
          from: (value) => value && parseFloat(value),
          to: (value) => value && value.toString(),
        },})\n${propName}: ${isNullable ? 'number | null' : 'number'};`;
      }
    );

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`🛠️ Fixed: ${file}`);
  });

  // Step 2: Rename files to kebab-case
  files.forEach((file) => {
    const fullPath = path.join(outputDir, file);
    const kebabName =
      file
        .replace(/\.ts$/, '')
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .toLowerCase() + '.ts';

    if (file !== kebabName) {
      const newFullPath = path.join(outputDir, kebabName);
      fs.renameSync(fullPath, newFullPath);
      console.log(`✅ Renamed: ${file} → ${kebabName}`);
    }
  });

  console.log(`✅ Done.\n${stdout}`);
});
