/**
 * Build script for DevTools Sidebar Extension
 * Bundles, minifies, and packages the extension for Chrome Web Store / CRX
 * 
 * Usage: node build.js
 * Output: dist/ folder with minified extension + devtools-sidebar.zip
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SRC_DIR = __dirname;
const DIST_DIR = path.join(__dirname, 'dist');
const ZIP_NAME = 'devtools-sidebar.zip';

// Files to process
const JS_FILES = [
  'background/service-worker.js',
  'content/content-script.js',
  'content/page-hooks.js',
  'panel/panel.js'
];

const CSS_FILES = [
  'panel/panel.css'
];

const COPY_FILES = [
  'manifest.json',
  'panel/panel.html'
];

// ============================================
// HELPERS
// ============================================

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function cleanDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
}

// Simple JS minifier (removes comments, excess whitespace)
// Falls back if terser is not available
function minifyJs(code) {
  // Remove single-line comments (but not URLs with //)
  let result = code.replace(/(?<![:'"])\/\/(?![\/:]).*$/gm, '');
  // Remove multi-line comments
  result = result.replace(/\/\*[\s\S]*?\*\//g, '');
  // Collapse multiple blank lines to one
  result = result.replace(/\n\s*\n\s*\n/g, '\n\n');
  // Remove trailing whitespace on lines
  result = result.replace(/[ \t]+$/gm, '');
  return result;
}

// Simple CSS minifier
function minifyCss(code) {
  // Remove comments
  let result = code.replace(/\/\*[\s\S]*?\*\//g, '');
  // Remove excess whitespace
  result = result.replace(/\s+/g, ' ');
  // Remove spaces around braces, colons, semicolons
  result = result.replace(/\s*{\s*/g, '{');
  result = result.replace(/\s*}\s*/g, '}');
  result = result.replace(/\s*:\s*/g, ':');
  result = result.replace(/\s*;\s*/g, ';');
  result = result.replace(/\s*,\s*/g, ',');
  // Remove last semicolon before closing brace
  result = result.replace(/;}/g, '}');
  return result.trim();
}

// ============================================
// BUILD STEPS
// ============================================

console.log('🔨 Building DevTools Sidebar Extension...\n');

// Step 1: Clean dist directory
console.log('1. Cleaning dist directory...');
cleanDir(DIST_DIR);

// Step 2: Check if terser is available for better minification
let hasTerser = false;
try {
  require.resolve('terser');
  hasTerser = true;
  console.log('   ✅ Terser found - will use advanced minification');
} catch (e) {
  console.log('   ⚠️  Terser not found - using basic minification');
  console.log('   💡 For better minification, run: npm install terser');
}

// Step 3: Process JS files
console.log('\n2. Processing JavaScript files...');
JS_FILES.forEach(function (relPath) {
  const srcPath = path.join(SRC_DIR, relPath);
  const distPath = path.join(DIST_DIR, relPath);
  ensureDir(path.dirname(distPath));

  const code = fs.readFileSync(srcPath, 'utf-8');
  const originalSize = Buffer.byteLength(code, 'utf-8');

  let minified;
  if (hasTerser) {
    // Use terser synchronously via CLI
    try {
      const tmpIn = path.join(DIST_DIR, '_tmp_in.js');
      fs.writeFileSync(tmpIn, code);
      execSync(`npx terser "${tmpIn}" --compress --mangle --output "${distPath}"`, {
        cwd: SRC_DIR,
        stdio: 'pipe'
      });
      fs.unlinkSync(tmpIn);
      minified = fs.readFileSync(distPath, 'utf-8');
    } catch (e) {
      // Fallback to basic minification
      minified = minifyJs(code);
      fs.writeFileSync(distPath, minified);
    }
  } else {
    minified = minifyJs(code);
    fs.writeFileSync(distPath, minified);
  }

  const minifiedSize = Buffer.byteLength(fs.readFileSync(distPath, 'utf-8'), 'utf-8');
  const reduction = ((1 - minifiedSize / originalSize) * 100).toFixed(1);
  console.log(`   📄 ${relPath}: ${(originalSize / 1024).toFixed(1)}KB → ${(minifiedSize / 1024).toFixed(1)}KB (${reduction}% smaller)`);
});

// Step 4: Process CSS files
console.log('\n3. Processing CSS files...');
CSS_FILES.forEach(function (relPath) {
  const srcPath = path.join(SRC_DIR, relPath);
  const distPath = path.join(DIST_DIR, relPath);
  ensureDir(path.dirname(distPath));

  const code = fs.readFileSync(srcPath, 'utf-8');
  const originalSize = Buffer.byteLength(code, 'utf-8');

  const minified = minifyCss(code);
  fs.writeFileSync(distPath, minified);

  const minifiedSize = Buffer.byteLength(minified, 'utf-8');
  const reduction = ((1 - minifiedSize / originalSize) * 100).toFixed(1);
  console.log(`   🎨 ${relPath}: ${(originalSize / 1024).toFixed(1)}KB → ${(minifiedSize / 1024).toFixed(1)}KB (${reduction}% smaller)`);
});

// Step 5: Copy static files
console.log('\n4. Copying static files...');
COPY_FILES.forEach(function (relPath) {
  const srcPath = path.join(SRC_DIR, relPath);
  const distPath = path.join(DIST_DIR, relPath);
  ensureDir(path.dirname(distPath));

  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, distPath);
    console.log(`   📋 ${relPath}`);
  } else {
    console.log(`   ⚠️  ${relPath} not found, skipping`);
  }
});

// Step 6: Copy all icon files
console.log('\n5. Setting up icons...');
const iconsDir = path.join(DIST_DIR, 'icons');
ensureDir(iconsDir);

const srcIconsDir = path.join(SRC_DIR, 'icons');
if (fs.existsSync(srcIconsDir)) {
  const iconFiles = fs.readdirSync(srcIconsDir);
  let iconCount = 0;
  iconFiles.forEach(function (file) {
    if (file.endsWith('.png') || file.endsWith('.svg')) {
      fs.copyFileSync(path.join(srcIconsDir, file), path.join(iconsDir, file));
      iconCount++;
    }
  });
  console.log('   🖼️  Copied ' + iconCount + ' icon files');
} else {
  console.log('   ⚠️  Icons directory not found');
}

// Step 7: Create ZIP file for Chrome Web Store upload
console.log('\n6. Creating ZIP package...');
try {
  const zipPath = path.join(SRC_DIR, ZIP_NAME);
  // Use PowerShell to create zip
  if (process.platform === 'win32') {
    // Remove existing zip
    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
    execSync(`powershell -Command "Compress-Archive -Path '${DIST_DIR}\\*' -DestinationPath '${zipPath}' -Force"`, {
      stdio: 'pipe'
    });
  } else {
    execSync(`cd "${DIST_DIR}" && zip -r "${zipPath}" .`, { stdio: 'pipe' });
  }

  if (fs.existsSync(zipPath)) {
    const zipSize = fs.statSync(zipPath).size;
    console.log(`   📦 ${ZIP_NAME}: ${(zipSize / 1024).toFixed(1)}KB`);
  }
} catch (e) {
  console.log('   ⚠️  Could not create ZIP: ' + e.message);
  console.log('   💡 You can manually zip the dist/ folder');
}

// Step 8: Summary
console.log('\n' + '='.repeat(50));
console.log('✅ Build complete!\n');
console.log('📂 Output directory: dist/');
console.log('📦 ZIP package: ' + ZIP_NAME);
console.log('\nTo load in Chrome:');
console.log('  1. Go to chrome://extensions/');
console.log('  2. Enable "Developer mode"');
console.log('  3. Click "Load unpacked"');
console.log('  4. Select the dist/ folder');
console.log('\nTo upload to Chrome Web Store:');
console.log('  1. Go to https://chrome.google.com/webstore/devconsole');
console.log('  2. Upload ' + ZIP_NAME);
console.log('='.repeat(50));
