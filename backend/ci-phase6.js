/* CI script for Phase 6: install deps, prisma setup, start server, run tests, stop server */
const { spawnSync, spawn } = require('child_process');
const path = require('path');
const axios = require('axios');

const cwd = __dirname;

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: false, ...opts });
  if (res.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} failed with code ${res.status}`);
  }
}

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await axios.get(url, { timeout: 1000 });
      if (res.status === 200) return;
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server did not become ready at ${url} within ${timeoutMs}ms`);
}

(async () => {
  try {
    console.log('\n==> Installing backend dependencies');
    run('npm', ['install']);

    console.log('\n==> Generating Prisma client');
    run('npx', ['prisma', 'generate']);

    console.log('\n==> Applying Prisma migrations');
    run('npx', ['prisma', 'migrate', 'deploy']);

    console.log('\n==> Starting backend server');
    const server = spawn(process.execPath, [path.join(cwd, 'server.js')], { cwd, stdio: 'inherit' });

    let shuttingDown = false;
    const shutdown = () => {
      if (shuttingDown) return; shuttingDown = true;
      if (server && !server.killed) {
        try { server.kill('SIGTERM'); } catch (_) {}
      }
    };

    process.on('exit', shutdown);
    process.on('SIGINT', () => { shutdown(); process.exit(1); });
    process.on('SIGTERM', () => { shutdown(); process.exit(1); });

    console.log('\n==> Waiting for server readiness');
    await waitForServer('http://localhost:5000/');
    console.log('Server is up');

    console.log('\n==> Running Phase 6 tests');
    run(process.execPath, [path.join(cwd, 'test-phase6-reports.js')]);

    console.log('\n==> Phase 6 tests completed successfully');
    shutdown();
    process.exit(0);
  } catch (err) {
    console.error('\nCI failed:', err.message);
    process.exit(1);
  }
})();
