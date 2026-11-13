import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const npxCmd = isWindows ? 'npx.cmd' : 'npx';

const FRONTEND_DIR = path.join(__dirname, 'pollution-center');
const BACKEND_DIR = path.join(__dirname, 'pollution-center', 'server');

console.log('\n' + '='.repeat(64));
console.log('   🚀 POLLUTION CENTER SYSTEM — UNIFIED LAUNCHER');
console.log('='.repeat(64) + '\n');

// 1. Check dependencies
async function ensureDependencies() {
  const backendModules = path.join(BACKEND_DIR, 'node_modules');
  const frontendModules = path.join(FRONTEND_DIR, 'node_modules');

  if (!fs.existsSync(backendModules)) {
    console.log('📦 Installing backend dependencies (pollution-center/server)...');
    await runCommand(npmCmd, ['install'], BACKEND_DIR);
  }

  if (!fs.existsSync(frontendModules)) {
    console.log('📦 Installing frontend dependencies (pollution-center)...');
    await runCommand(npmCmd, ['install'], FRONTEND_DIR);
  }
}

// 2. Check Ollama service
async function checkOllama() {
  console.log('🔍 Checking Ollama AI status...');
  try {
    const res = await fetch('http://localhost:11434/api/tags');
    if (res.ok) {
      const data = await res.json();
      const hasQwen = data.models?.some(m => m.name.includes('qwen3:8b') || m.name.includes('qwen3'));
      if (hasQwen) {
        console.log('   ✅ Ollama is running with model "qwen3:8b"');
      } else {
        console.log('   ⚠️  Ollama is running, but "qwen3:8b" was not found in installed models.');
        console.log('   👉 Run "ollama pull qwen3:8b" to download the local model.\n');
      }
      return true;
    }
  } catch (err) {
    console.log('   ⚠️  Ollama is not running on http://localhost:11434.');
    console.log('   Attempting to start Ollama automatically...');
    try {
      const ollamaProcess = spawn('ollama', ['serve'], {
        detached: true,
        stdio: 'ignore',
        shell: isWindows
      });
      ollamaProcess.unref();

      // Wait 3 seconds to check if it started
      await new Promise(r => setTimeout(r, 3000));
      const retryRes = await fetch('http://localhost:11434/api/tags').catch(() => null);
      if (retryRes && retryRes.ok) {
        console.log('   ✅ Ollama service started successfully!');
        return true;
      }
    } catch {
      // ignore
    }

    console.log('   💡 Tip: Please ensure Ollama is installed (https://ollama.com) and run "ollama serve" for local AI.');
  }
  return false;
}

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

function prefixStream(stream, prefix, colorCode = '36') {
  stream.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        console.log(`\x1b[${colorCode}m[${prefix}]\x1b[0m ${line}`);
      }
    }
  });
}

async function main() {
  try {
    await ensureDependencies();
    await checkOllama();

    console.log('\n🌟 Starting Backend API and Frontend Dev Server...\n');

    // Spawn Backend
    const backendProc = spawn('node', ['server.js'], {
      cwd: BACKEND_DIR,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: isWindows
    });
    prefixStream(backendProc.stdout, 'BACKEND', '33'); // Yellow
    prefixStream(backendProc.stderr, 'BACKEND:ERR', '31');

    // Spawn Frontend
    const frontendProc = spawn(npmCmd, ['run', 'dev'], {
      cwd: FRONTEND_DIR,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: isWindows
    });
    prefixStream(frontendProc.stdout, 'FRONTEND', '34'); // Blue
    prefixStream(frontendProc.stderr, 'FRONTEND:ERR', '31');

    console.log('='.repeat(64));
    console.log('   🌐 Application Links:');
    console.log('   • Frontend Web App : http://localhost:5173');
    console.log('   • AI Assistant Page: http://localhost:5173/ai-chat');
    console.log('   • Backend API      : http://localhost:3001');
    console.log('   • Local Ollama AI  : http://localhost:11434');
    console.log('   • Default Login    : aswin / aswin123');
    console.log('='.repeat(64));
    console.log('   Press Ctrl+C to stop all servers at once.\n');

    // Automatically open browser after servers initialize
    setTimeout(() => {
      const openCmd = isWindows ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
      try {
        spawn(openCmd, ['http://localhost:5173/ai-chat'], { shell: true, stdio: 'ignore' });
      } catch (e) {
        // ignore
      }
    }, 2000);

    // Handle graceful shutdown
    const cleanup = () => {
      console.log('\n🛑 Shutting down all services...');
      try {
        if (isWindows) {
          if (backendProc.pid) spawn('taskkill', ['/pid', backendProc.pid.toString(), '/f', '/t'], { stdio: 'ignore' });
          if (frontendProc.pid) spawn('taskkill', ['/pid', frontendProc.pid.toString(), '/f', '/t'], { stdio: 'ignore' });
        } else {
          backendProc.kill('SIGTERM');
          frontendProc.kill('SIGTERM');
        }
      } catch (e) {
        // ignore
      }
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('exit', cleanup);

  } catch (err) {
    console.error('Fatal launcher error:', err);
    process.exit(1);
  }
}

main();
