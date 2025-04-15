#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const tsNodeDev = path.resolve(__dirname, 'node_modules/.bin/ts-node-dev');
const scriptPath = path.resolve(__dirname, 'src/index.ts');

const child = spawn(tsNodeDev, ['--respawn', '--transpile-only', scriptPath], {
  stdio: 'inherit',
  shell: true
});

child.on('error', (err) => {
  console.error('Failed to start subprocess:', err);
  process.exit(1);
});

process.on('SIGINT', () => {
  child.kill('SIGINT');
  process.exit(0);
}); 