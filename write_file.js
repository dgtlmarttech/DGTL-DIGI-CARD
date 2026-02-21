const fs = require('fs');
const path = require('path');

const filePath = process.argv[2];
const contentPath = process.argv[3];

try {
    const content = fs.readFileSync(contentPath, 'utf8');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Successfully wrote to ${filePath}`);
} catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
}
