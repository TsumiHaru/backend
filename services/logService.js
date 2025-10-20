import fs from 'fs';
import path from 'path';

const logsDir = path.resolve('./logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const logfile = path.join(logsDir, 'frontend-errors.log');

export function appendLog(entry) {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n';
  fs.appendFile(logfile, line, (err) => {
    if (err) console.error('Failed to write log:', err);
  });
}

export default { appendLog };
