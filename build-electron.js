const fs = require('fs');
const path = require('path');

// Read the main package.json
const mainPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Create a new package.json for the electron build without "type": "module"
const electronPackage = {
  name: mainPackage.name,
  version: mainPackage.version,
  description: mainPackage.description,
  main: 'electron.js',
  dependencies: mainPackage.dependencies,
  devDependencies: mainPackage.devDependencies
};

// Write it temporarily
fs.writeFileSync('package-electron-temp.json', JSON.stringify(electronPackage, null, 2));

console.log('Created electron-compatible package.json');
