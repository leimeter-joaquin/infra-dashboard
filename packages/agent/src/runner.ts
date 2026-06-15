// SECURITY SURFACE: this module executes OS commands.
// Only call it from routes/actions.ts after whitelist validation has passed.
// Never pass user-supplied strings as cmd or args.
import { spawn, type ChildProcess } from 'node:child_process';

export interface CommandResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

// Tracks long-running (detached) processes started via spawnDetached, keyed by action id.
// This lets the dashboard later stop a process it started without needing OS-level pid lookup.
const runningProcesses = new Map<string, ChildProcess>();

export function isRunning(actionId: string): boolean {
  return runningProcesses.has(actionId);
}

// Starts a long-running process (e.g. a dev server) in its own process group and does not
// wait for it to exit. Use stopProcess(actionId) to terminate the whole group later.
export function spawnDetached(
  actionId: string,
  cmd: string,
  args: string[],
  cwd?: string
): CommandResult {
  if (runningProcesses.has(actionId)) {
    return {
      ok: false,
      stdout: '',
      stderr: `Action "${actionId}" is already running`,
      exitCode: null,
    };
  }

  const child = spawn(cmd, args, { cwd, shell: false, detached: true, stdio: 'ignore' });
  runningProcesses.set(actionId, child);

  child.on('exit', () => {
    runningProcesses.delete(actionId);
  });
  child.on('error', () => {
    runningProcesses.delete(actionId);
  });

  return { ok: true, stdout: '', stderr: '', exitCode: null };
}

// Kills the process group started by spawnDetached(actionId, ...).
export function stopProcess(actionId: string): CommandResult {
  const child = runningProcesses.get(actionId);
  if (!child || child.pid === undefined) {
    return { ok: false, stdout: '', stderr: `Action "${actionId}" is not running`, exitCode: null };
  }

  // Negative pid sends the signal to the whole process group (detached: true gave it its own).
  process.kill(-child.pid, 'SIGTERM');
  runningProcesses.delete(actionId);
  return { ok: true, stdout: '', stderr: '', exitCode: null };
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
      resolve({
        ok: false,
        stdout,
        stderr: `${stderr}\nExecution timed out after ${EXECUTION_TIMEOUT_MS}ms`,
        exitCode: -1,
      });
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
