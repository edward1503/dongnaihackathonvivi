// Keep the historical launch command on the same evidence and review API as Android.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const server = fileURLToPath(new URL('../server/', import.meta.url));
const child = spawn(process.env.PYTHON || 'python', [
  '-m', 'uvicorn', 'lcs.main:mvp_portal', '--factory', '--host', '0.0.0.0', '--port', process.argv[2] || '8020',
], { cwd: server, stdio: 'inherit' });
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => child.kill(signal));
child.on('error', () => {
  console.error('Cần cài Python và các gói trong server/requirements.txt để chạy máy chủ.');
  process.exitCode = 1;
});
child.on('exit', code => { process.exitCode = code ?? 1; });
