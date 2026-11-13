import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

const FRONTEND_DIR = path.join(__dirname, 'pollution-center');
const BACKEND_DIR = path.join(__dirname, 'pollution-center', 'server');

function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { cwd, stdio: 'inherit', shell: isWindows });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command ${command} ${args.join(' ')} failed with code ${code}`));
    });
    proc.on('error', reject);
  });
}

async function setup() {
  console.log('\n======================================================');
  console.log('   INSTALLING ALL PACKAGES (FRONTEND & BACKEND)');
  console.log('======================================================\n');

  console.log('1/2 Installing backend dependencies...');
  await runCommand(npmCmd, ['install'], BACKEND_DIR);

  console.log('\n2/2 Installing frontend dependencies...');
  await runCommand(npmCmd, ['install'], FRONTEND_DIR);

  console.log('\n======================================================');
  console.log('   ✅ ALL DEPENDENCIES INSTALLED SUCCESSFULLY!');
  console.log('   Run "npm start" or "node run.js" to start the app.');
  console.log('======================================================\n');
}

setup().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});
