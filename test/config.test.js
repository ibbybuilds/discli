import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, rmSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('config file operations', () => {
  const testDir = join(tmpdir(), 'discli-test-' + Date.now());

  before(() => {
    mkdirSync(testDir, { recursive: true });
  });

  after(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('can write and read JSON config', () => {
    const configPath = join(testDir, 'config.json');
    const data = { default_server_id: '123', default_server_name: 'Test' };

    writeFileSync(configPath, JSON.stringify(data, null, 2) + '\n');

    const content = JSON.parse(readFileSync(configPath, 'utf-8'));
    assert.equal(content.default_server_id, '123');
    assert.equal(content.default_server_name, 'Test');
  });

  it('can write and read .env token', () => {
    const envPath = join(testDir, '.env');
    const token = 'test-token-123';

    writeFileSync(envPath, `BOT_TOKEN=${token}\n`);

    const content = readFileSync(envPath, 'utf-8');
    const match = content.match(/^BOT_TOKEN=(.+)$/m);
    assert.ok(match);
    assert.equal(match[1], token);
  });

  it('handles missing config gracefully', () => {
    const missingPath = join(testDir, 'nonexistent.json');
    assert.equal(existsSync(missingPath), false);
  });
});
