#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const distDir = 'dist';
const requiredFiles = [
  'index.html',
  '404.html',
  '_redirects'
];

console.log('🔍 Verifying build for deployment...\n');

// Check if dist directory exists
if (!fs.existsSync(distDir)) {
  console.error('❌ dist directory not found!');
  process.exit(1);
}

// Check required files
let allFilesPresent = true;
requiredFiles.forEach(file => {
  const filePath = path.join(distDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} - Found`);
  } else {
    console.log(`❌ ${file} - Missing`);
    allFilesPresent = false;
  }
});

// Check _redirects content
const redirectsPath = path.join(distDir, '_redirects');
if (fs.existsSync(redirectsPath)) {
  const content = fs.readFileSync(redirectsPath, 'utf8');
  if (content.includes('/*') && content.includes('/index.html')) {
    console.log('✅ _redirects - Correctly configured for SPA');
  } else {
    console.log('⚠️  _redirects - May not be configured correctly for SPA');
  }
}

// Check if assets directory exists
const assetsDir = path.join(distDir, 'assets');
if (fs.existsSync(assetsDir)) {
  const assets = fs.readdirSync(assetsDir);
  console.log(`✅ assets directory - ${assets.length} files found`);
} else {
  console.log('❌ assets directory - Not found');
  allFilesPresent = false;
}

console.log('\n' + '='.repeat(50));
if (allFilesPresent) {
  console.log('✅ Build verification passed! Ready for deployment.');
} else {
  console.log('❌ Build verification failed! Check missing files.');
  process.exit(1);
}
