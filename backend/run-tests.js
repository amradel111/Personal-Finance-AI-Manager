const { spawn } = require('child_process');
const path = require('path');

console.log('Starting backend server...\n');

const serverPath = path.join(__dirname, 'server.js');
const server = spawn('node', [serverPath], {
  cwd: path.join(__dirname),
  env: process.env
});

server.stdout.on('data', (data) => {
  console.log(data.toString());
});

server.stderr.on('data', (data) => {
  console.error(data.toString());
});

// Wait for server to start
setTimeout(() => {
  console.log('\n\nRunning tests...\n');
  const test = spawn('node', [path.join(__dirname, 'test-phase2-complete.js')], {
    cwd: __dirname,
    stdio: 'inherit'
  });

  test.on('close', (code) => {
    console.log(`\nTests completed with code ${code}`);
    server.kill();
    process.exit(code);
  });
}, 3000);
