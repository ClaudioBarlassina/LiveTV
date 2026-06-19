import { chromium } from 'playwright';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');
const outDir = path.join(__dirname, 'screenshots');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function startServer() {
  return new Promise((resolve) => {
    const proc = spawn('npx.cmd', ['serve', distDir, '-p', '3456'], {
      cwd: __dirname,
      stdio: 'pipe',
      shell: true,
    });
    proc.stderr.on('data', () => {});
    proc.stdout.on('data', () => {});
    setTimeout(() => resolve(proc), 3000);
  });
}

async function takeScreenshots() {
  const server = await startServer();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  const baseUrl = 'http://localhost:3456';

  try {
    // Navigate to main page
    await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Screenshot 1: Main page (home)
    await page.screenshot({ path: path.join(outDir, '01-main.png'), fullPage: false });
    console.log('✓ 01-main.png');

    // Screenshot 2: Fixtures/Calendar page
    await page.goto(`${baseUrl}/fixtures`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outDir, '02-fixtures.png'), fullPage: false });
    console.log('✓ 02-fixtures.png');

    // Screenshot 3: Knockout page
    await page.goto(`${baseUrl}/knockout`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outDir, '03-knockout.png'), fullPage: false });
    console.log('✓ 03-knockout.png');

    // Screenshot 4: Standings page
    await page.goto(`${baseUrl}/standings`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outDir, '04-standings.png'), fullPage: false });
    console.log('✓ 04-standings.png');

    console.log('\nTodas las capturas guardadas en screenshots/');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
    server.kill();
  }
}

takeScreenshots();
