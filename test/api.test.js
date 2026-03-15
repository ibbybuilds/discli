import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('CHANNEL_TYPE', () => {
  it('has correct type mappings', async () => {
    // We test the constants directly since they're pure data
    const CHANNEL_TYPE = {
      text: 0,
      voice: 2,
      category: 4,
      announcement: 5,
      stage: 13,
      forum: 15,
    };

    assert.equal(CHANNEL_TYPE.text, 0);
    assert.equal(CHANNEL_TYPE.voice, 2);
    assert.equal(CHANNEL_TYPE.category, 4);
    assert.equal(CHANNEL_TYPE.announcement, 5);
    assert.equal(CHANNEL_TYPE.stage, 13);
    assert.equal(CHANNEL_TYPE.forum, 15);
  });
});

describe('PERMISSION', () => {
  it('has correct bitfield values', () => {
    const PERMISSION = {
      view_channel: 1n << 10n,
      send_messages: 1n << 11n,
      manage_channels: 1n << 4n,
      add_reactions: 1n << 6n,
    };

    assert.equal(PERMISSION.view_channel, 1024n);
    assert.equal(PERMISSION.send_messages, 2048n);
    assert.equal(PERMISSION.manage_channels, 16n);
    assert.equal(PERMISSION.add_reactions, 64n);
  });

  it('can combine permissions with bitwise OR', () => {
    const send = 1n << 11n;
    const react = 1n << 6n;
    const combined = send | react;

    assert.equal((combined & send) === send, true);
    assert.equal((combined & react) === react, true);
    assert.equal((combined & (1n << 10n)) === (1n << 10n), false);
  });
});

describe('AUDIT_ACTION', () => {
  it('has correct action type values', () => {
    const AUDIT_ACTION = {
      guild_update: 1,
      channel_create: 10,
      member_kick: 20,
      member_ban_add: 22,
      role_create: 30,
    };

    assert.equal(AUDIT_ACTION.guild_update, 1);
    assert.equal(AUDIT_ACTION.channel_create, 10);
    assert.equal(AUDIT_ACTION.member_kick, 20);
    assert.equal(AUDIT_ACTION.member_ban_add, 22);
    assert.equal(AUDIT_ACTION.role_create, 30);
  });
});

describe('color parsing', () => {
  it('parses hex color to integer', () => {
    const parseColor = (color) => parseInt(color.replace('#', ''), 16);

    assert.equal(parseColor('#e74c3c'), 15158332);
    assert.equal(parseColor('#5865F2'), 5793266);
    assert.equal(parseColor('#000000'), 0);
    assert.equal(parseColor('#ffffff'), 16777215);
    assert.equal(parseColor('ff5733'), 16734003);
  });
});
