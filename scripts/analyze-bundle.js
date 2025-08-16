#!/usr/bin/env node

/**
 * Bundle analyzer script for monitoring bundle sizes and optimization
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');

/**
 * Get file size in KB
 */
function getFileSizeKB(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return Math.round(stats.size / 1024 * 100) / 100;
  } catch (error) {
    return 0;
  }
}

/**
 * Get gzipped file size in KB
 */
function getGzippedSizeKB(filePath) {
  try {
    const gzipCommand = process.platform === 'win32' 
      ? `powershell -Command "& {Add-Type -AssemblyName System.IO.Compression; [System.IO.Compression.GzipStream]::new([System.IO.File]::OpenRead('${filePath}'), [System.IO.Compression.CompressionMode]::Compress) | ForEach-Object { $_.Length }}"` 
      : `gzip -c "${filePath}" | wc -c`;
    
    const result = execSync(gzipCommand, { encoding: 'utf8' });
    const bytes = parseInt(result.trim());
    return Math.round(bytes / 1024 * 100) / 100;
  } catch (error) {
    // Fallback: estimate gzipped size as ~30% of original
    return Math.round(getFileSizeKB(filePath) * 0.3 * 100) / 100;
  }
}

/**
 * Analyze bundle files
 */
function analyzeBundles() {
  if (!fs.existsSync(distDir)) {
    console.error('❌ Dist directory not found. Run "npm run build" first.');
    process.exit(1);
  }

  const assetsDir = path.join(distDir, 'assets');
  if (!fs.existsSync(assetsDir)) {
    console.error('❌ Assets directory not found in dist.');
    process.exit(1);
  }

  const files = fs.readdirSync(assetsDir);
  
  const jsFiles = files.filter(file => file.endsWith('.js'));
  const cssFiles = files.filter(file => file.endsWith('.css'));
  const imageFiles = files.filter(file => /\.(png|jpg|jpeg|gif|svg|webp|avif|ico)$/i.test(file));
  const fontFiles = files.filter(file => /\.(woff2?|eot|ttf|otf)$/i.test(file));

  console.log('📊 Bundle Analysis Report');
  console.log('========================\n');

  // Analyze JavaScript bundles
  if (jsFiles.length > 0) {
    console.log('🟨 JavaScript Bundles:');
    let totalJSSize = 0;
    let totalJSGzipped = 0;

    jsFiles.forEach(file => {
      const filePath = path.join(assetsDir, file);
      const size = getFileSizeKB(filePath);
      const gzippedSize = getGzippedSizeKB(filePath);
      
      totalJSSize += size;
      totalJSGzipped += gzippedSize;

      const sizeStatus = size > 500 ? '🔴' : size > 250 ? '🟡' : '🟢';
      console.log(`  ${sizeStatus} ${file}: ${size}KB (${gzippedSize}KB gzipped)`);
    });

    console.log(`  📦 Total JS: ${totalJSSize}KB (${totalJSGzipped}KB gzipped)\n`);
  }

  // Analyze CSS bundles
  if (cssFiles.length > 0) {
    console.log('🟦 CSS Bundles:');
    let totalCSSSize = 0;
    let totalCSSGzipped = 0;

    cssFiles.forEach(file => {
      const filePath = path.join(assetsDir, file);
      const size = getFileSizeKB(filePath);
      const gzippedSize = getGzippedSizeKB(filePath);
      
      totalCSSSize += size;
      totalCSSGzipped += gzippedSize;

      const sizeStatus = size > 100 ? '🔴' : size > 50 ? '🟡' : '🟢';
      console.log(`  ${sizeStatus} ${file}: ${size}KB (${gzippedSize}KB gzipped)`);
    });

    console.log(`  📦 Total CSS: ${totalCSSSize}KB (${totalCSSGzipped}KB gzipped)\n`);
  }

  // Analyze images
  if (imageFiles.length > 0) {
    console.log('🖼️  Images:');
    let totalImageSize = 0;

    imageFiles.forEach(file => {
      const filePath = path.join(assetsDir, file);
      const size = getFileSizeKB(filePath);
      totalImageSize += size;

      const sizeStatus = size > 500 ? '🔴' : size > 100 ? '🟡' : '🟢';
      console.log(`  ${sizeStatus} ${file}: ${size}KB`);
    });

    console.log(`  📦 Total Images: ${totalImageSize}KB\n`);
  }

  // Analyze fonts
  if (fontFiles.length > 0) {
    console.log('🔤 Fonts:');
    let totalFontSize = 0;

    fontFiles.forEach(file => {
      const filePath = path.join(assetsDir, file);
      const size = getFileSizeKB(filePath);
      totalFontSize += size;

      const sizeStatus = size > 200 ? '🔴' : size > 100 ? '🟡' : '🟢';
      console.log(`  ${sizeStatus} ${file}: ${size}KB`);
    });

    console.log(`  📦 Total Fonts: ${totalFontSize}KB\n`);
  }

  // Overall summary
  const totalSize = jsFiles.reduce((sum, file) => sum + getFileSizeKB(path.join(assetsDir, file)), 0) +
                   cssFiles.reduce((sum, file) => sum + getFileSizeKB(path.join(assetsDir, file)), 0) +
                   imageFiles.reduce((sum, file) => sum + getFileSizeKB(path.join(assetsDir, file)), 0) +
                   fontFiles.reduce((sum, file) => sum + getFileSizeKB(path.join(assetsDir, file)), 0);

  console.log('📈 Summary:');
  console.log(`  Total Bundle Size: ${totalSize}KB`);
  
  // Performance recommendations
  console.log('\n💡 Recommendations:');
  
  if (totalSize > 2000) {
    console.log('  🔴 Bundle size is quite large (>2MB). Consider:');
    console.log('     - Code splitting');
    console.log('     - Lazy loading components');
    console.log('     - Tree shaking unused code');
  } else if (totalSize > 1000) {
    console.log('  🟡 Bundle size is moderate (>1MB). Consider:');
    console.log('     - Image optimization');
    console.log('     - Removing unused dependencies');
  } else {
    console.log('  🟢 Bundle size looks good!');
  }

  // Check for large individual files
  const largeFiles = [...jsFiles, ...cssFiles].filter(file => {
    const size = getFileSizeKB(path.join(assetsDir, file));
    return size > 500;
  });

  if (largeFiles.length > 0) {
    console.log('\n⚠️  Large files detected:');
    largeFiles.forEach(file => {
      const size = getFileSizeKB(path.join(assetsDir, file));
      console.log(`     ${file}: ${size}KB`);
    });
    console.log('   Consider splitting these files or optimizing their content.');
  }

  // Check for duplicate dependencies
  console.log('\n🔍 Checking for potential optimizations...');
  
  const vendorFiles = jsFiles.filter(file => file.includes('vendor') || file.includes('chunk'));
  if (vendorFiles.length > 3) {
    console.log('  ⚠️  Many vendor chunks detected. Consider optimizing chunk splitting.');
  }

  const duplicatePatterns = jsFiles.filter(file => 
    jsFiles.some(other => other !== file && other.includes(file.split('-')[0]))
  );
  
  if (duplicatePatterns.length > 0) {
    console.log('  ⚠️  Potential duplicate code patterns detected.');
  }

  console.log('\n✅ Analysis complete!');
}

/**
 * Compare with previous build
 */
function compareWithPrevious() {
  const reportFile = path.join(projectRoot, '.bundle-report.json');
  const currentReport = generateReport();

  if (fs.existsSync(reportFile)) {
    const previousReport = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
    
    console.log('\n📊 Size Comparison:');
    console.log('==================');
    
    const jsChange = currentReport.totalJS - previousReport.totalJS;
    const cssChange = currentReport.totalCSS - previousReport.totalCSS;
    const totalChange = currentReport.totalSize - previousReport.totalSize;
    
    console.log(`JavaScript: ${previousReport.totalJS}KB → ${currentReport.totalJS}KB (${jsChange >= 0 ? '+' : ''}${jsChange}KB)`);
    console.log(`CSS: ${previousReport.totalCSS}KB → ${currentReport.totalCSS}KB (${cssChange >= 0 ? '+' : ''}${cssChange}KB)`);
    console.log(`Total: ${previousReport.totalSize}KB → ${currentReport.totalSize}KB (${totalChange >= 0 ? '+' : ''}${totalChange}KB)`);
    
    if (totalChange > 50) {
      console.log('🔴 Bundle size increased significantly!');
    } else if (totalChange < -50) {
      console.log('🟢 Great! Bundle size decreased significantly!');
    } else {
      console.log('🟡 Bundle size change is minimal.');
    }
  }

  // Save current report
  fs.writeFileSync(reportFile, JSON.stringify(currentReport, null, 2));
}

/**
 * Generate report data
 */
function generateReport() {
  const assetsDir = path.join(distDir, 'assets');
  const files = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [];
  
  const jsFiles = files.filter(file => file.endsWith('.js'));
  const cssFiles = files.filter(file => file.endsWith('.css'));
  
  const totalJS = jsFiles.reduce((sum, file) => sum + getFileSizeKB(path.join(assetsDir, file)), 0);
  const totalCSS = cssFiles.reduce((sum, file) => sum + getFileSizeKB(path.join(assetsDir, file)), 0);
  
  return {
    timestamp: new Date().toISOString(),
    totalJS,
    totalCSS,
    totalSize: totalJS + totalCSS,
    files: {
      js: jsFiles.length,
      css: cssFiles.length,
    },
  };
}

// Run analysis
if (process.argv.includes('--compare')) {
  compareWithPrevious();
} else {
  analyzeBundles();
}

export { analyzeBundles, compareWithPrevious };