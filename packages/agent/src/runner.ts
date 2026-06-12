// SECURITY SURFACE: this module executes OS commands.
// Only call it from routes/actions.ts after whitelist validation has passed.
// Never pass user-supplied strings as cmd or args.
import { spawn } from 'node:child_process';

export interface CommandResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

const EXECUTION_TIMEOUT_MS = 30_000;

export function executeCommand(cmd: string, args: string[]): Promise<CommandResult> {
  return new Promise((resolve) => {
    // shell: false prevents shell injection — cmd and args are passed directly to the OS.
    const child = spawn(cmd, args, { shell: false });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      resolve({ ok: false, stdout, stderr: `${stderr}\nExecution timed out after ${EXECUTION_TIMEOUT_MS}ms`, exitCode: -1 });
    }, EXECUTION_TIMEOUT_MS);

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ ok: code === 0, stdout, stderr, exitCode: code });
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({ ok: false, stdout, stderr: err.message, exitCode: 1 });
    });
  });
}
