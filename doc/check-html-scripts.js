const fs = require('fs');

const files = ['index.html', 'module1.html', 'module2.html', 'module3.html', 'module4.html'];

for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  const match = html.match(/<script>([\s\S]*)<\/script>/);
  if (!match) {
    throw new Error(`missing script: ${file}`);
  }

  new Function(match[1]);
  console.log(`ok ${file}`);
}
