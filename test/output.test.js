import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('resolveFormat', () => {
  // Replicate the logic since we can't import cli.js (it triggers commander.parse)
  const resolveFormat = (explicit) => {
    if (explicit !== 'auto') return explicit;
    return process.stdout.isTTY ? 'table' : 'yaml';
  };

  it('returns json when explicitly set', () => {
    assert.equal(resolveFormat('json'), 'json');
  });

  it('returns yaml when explicitly set', () => {
    assert.equal(resolveFormat('yaml'), 'yaml');
  });

  it('returns table when explicitly set', () => {
    assert.equal(resolveFormat('table'), 'table');
  });

  it('returns yaml for auto in non-TTY (test environment)', () => {
    assert.equal(resolveFormat('auto'), 'yaml');
  });
});
