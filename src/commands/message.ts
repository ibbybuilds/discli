import { Command } from 'commander';
import { DiscordAPI } from '../utils/api.js';
import { requireToken, requireServer } from '../utils/config.js';
import { printResult, resolveFormat } from '../utils/output.js';
import { resolveChannel } from '../utils/resolve.js';

export function registerMessage(program: Command): void {
  const message = program
    .command('message')
    .alias('msg')
    .description('Send, read, and manage messages');

  message
    .command('send')
    .description('Send a message to a channel')
    .argument('<channel>', 'Channel name or ID')
    .argument('<text>', 'Message content')
    .action(async (channelName: string, text: string) => {
      const fmt = resolveFormat(program.opts().format);
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const ch = await resolveChannel(api, guildId, channelName);

      const msg = await api.sendMessage(ch.id, text);
      if (fmt !== 'table') {
        printResult(msg, fmt);
      } else {
        console.log(`Sent message to #${ch.name} (${msg.id})`);
      }
    });

  message
    .command('read')
    .description('Read recent messages from a channel')
    .argument('<channel>', 'Channel name or ID')
    .option('-n <count>', 'Number of messages to fetch', '10')
    .option('--before <id>', 'Fetch messages before this message ID')
    .action(async (channelName: string, opts) => {
      const fmt = resolveFormat(program.opts().format);
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const ch = await resolveChannel(api, guildId, channelName);

      const messages = await api.getMessages(ch.id, parseInt(opts.n), opts.before);

      if (fmt !== 'table') {
        printResult(messages, fmt);
        return;
      }

      console.log(`\n#${ch.name} — last ${messages.length} messages`);
      console.log('─'.repeat(40));

      for (const msg of messages.reverse()) {
        const time = new Date(msg.timestamp).toLocaleString();
        const bot = msg.author.bot ? ' [BOT]' : '';
        const edited = msg.edited_timestamp ? ' (edited)' : '';
        const pinned = msg.pinned ? ' 📌' : '';
        console.log(`  ${msg.author.username}${bot} — ${time}${edited}${pinned}`);
        if (msg.content) console.log(`    ${msg.content}`);
        console.log();
      }
    });

  message
    .command('edit')
    .description('Edit a message sent by the bot')
    .argument('<channel>', 'Channel name or ID')
    .argument('<message-id>', 'Message ID to edit')
    .argument('<text>', 'New message content')
    .action(async (channelName: string, messageId: string, text: string) => {
      const fmt = resolveFormat(program.opts().format);
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const ch = await resolveChannel(api, guildId, channelName);

      const msg = await api.editMessage(ch.id, messageId, text);
      if (fmt !== 'table') {
        printResult(msg, fmt);
      } else {
        console.log(`Edited message ${messageId} in #${ch.name}`);
      }
    });

  message
    .command('delete')
    .description('Delete a message')
    .argument('<channel>', 'Channel name or ID')
    .argument('<message-id>', 'Message ID to delete')
    .option('--confirm', 'Required to actually delete')
    .action(async (channelName: string, messageId: string, opts) => {
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const ch = await resolveChannel(api, guildId, channelName);

      if (!opts.confirm) {
        console.error(`This will delete message ${messageId} in #${ch.name}. Add --confirm to proceed.`);
        process.exit(2);
      }

      await api.deleteMessage(ch.id, messageId);
      console.log(`Deleted message ${messageId} from #${ch.name}`);
    });

  message
    .command('pin')
    .description('Pin a message')
    .argument('<channel>', 'Channel name or ID')
    .argument('<message-id>', 'Message ID to pin')
    .action(async (channelName: string, messageId: string) => {
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const ch = await resolveChannel(api, guildId, channelName);

      await api.pinMessage(ch.id, messageId);
      console.log(`Pinned message ${messageId} in #${ch.name}`);
    });

  message
    .command('unpin')
    .description('Unpin a message')
    .argument('<channel>', 'Channel name or ID')
    .argument('<message-id>', 'Message ID to unpin')
    .action(async (channelName: string, messageId: string) => {
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const ch = await resolveChannel(api, guildId, channelName);

      await api.unpinMessage(ch.id, messageId);
      console.log(`Unpinned message ${messageId} in #${ch.name}`);
    });

  message
    .command('pins')
    .description('List pinned messages in a channel')
    .argument('<channel>', 'Channel name or ID')
    .action(async (channelName: string) => {
      const fmt = resolveFormat(program.opts().format);
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const ch = await resolveChannel(api, guildId, channelName);

      const pins = await api.getPinnedMessages(ch.id);

      if (fmt !== 'table') {
        printResult(pins, fmt);
        return;
      }

      if (pins.length === 0) {
        console.log(`\n#${ch.name}: no pinned messages`);
        return;
      }

      console.log(`\n#${ch.name} — ${pins.length} pinned`);
      console.log('─'.repeat(30));
      for (const msg of pins) {
        const time = new Date(msg.timestamp).toLocaleString();
        console.log(`  ${msg.author.username} — ${time}`);
        if (msg.content) console.log(`    ${msg.content}`);
        console.log(`    ID: ${msg.id}`);
        console.log();
      }
    });
}
