const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const serverEntry = path.join(rootDir, 'server', 'index.js');
const nodemonEntry = path.join(rootDir, 'node_modules', 'nodemon', 'bin', 'nodemon.js');
const viteEntry = path.join(rootDir, 'client', 'node_modules', 'vite', 'bin', 'vite.js');
const clientDir = path.join(rootDir, 'client');

function startProcess(label, command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: options.cwd,
    env: process.env,
    stdio: 'inherit',
    shell: false,
  });

  child.on('error', (error) => {
    console.error(`[${label}] failed to start:`, error.message);
    shutdown(1);
  });

  child.on('exit', (code, signal) => {
    if (shuttingDown) {
      return;
    }

    if (signal) {
      console.log(`[${label}] exited with signal ${signal}`);
      shutdown(1);
      return;
    }

    console.log(`[${label}] exited with code ${code}`);
    shutdown(typeof code === 'number' ? code : 1);
  });

  return child;
}

let shuttingDown = false;
const processes = [];

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of processes) {
    if (!child.killed) {
      child.kill();
    }
  }

  process.exit(exitCode);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

process.on('uncaughtException', (error) => {
  console.error(error);
  shutdown(1);
});

process.on('unhandledRejection', (error) => {
  console.error(error);
  shutdown(1);
});

process.stdout.write('[dev] starting server and client...\n');

processes.push(
  startProcess('server', process.execPath, [nodemonEntry, serverEntry, '--watch', 'server'], {
    cwd: rootDir,
  }),
);

processes.push(
  startProcess('client', process.execPath, [viteEntry, '--port', '3000'], {
    cwd: clientDir,
  }),
);
