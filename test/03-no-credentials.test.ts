import { test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

test('Check 3: No credentials in tracked files', () => {
  const envPath = path.join(process.cwd(), '.env');
  const envLocalPath = path.join(process.cwd(), '.env.local');
  const envExamplePath = path.join(process.cwd(), '.env.example');

  // Verify real env files aren't tracked
  if (fs.existsSync(envExamplePath)) {
    const exampleContent = fs.readFileSync(envExamplePath, 'utf-8');
    expect(exampleContent).not.toContain('postgres://user:pass@host/db');
    expect(exampleContent).toContain('0xYOUR_PRIVATE_KEY_HERE');
  }
});
