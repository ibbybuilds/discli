import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { resolve, join } from 'path';
import { Command } from 'commander';
import { DiscordAPI } from '../utils/api.js';
import type { Embed, MessagePayload } from '../utils/api.js';
import { requireToken, requireServer } from '../utils/config.js';
import { printResult, resolveFormat } from '../utils/output.js';
import { resolveChannel } from '../utils/resolve.js';

function parseColor(color: string): number {
  return parseInt(color.replace('#', ''), 16);
}

export function registerMessage(program: Command): void {
  const message = program
    .command('message')
    .alias('msg')
    .description('Send, read, and manage messages');

  message
    .command('send')
    .description('Send a message to a channel')
    .argument('<channel>', 'Channel name or ID')
    .argument('[text]', 'Message content (supports Discord markdown)')
    .option('--reply <id>', 'Reply to a message ID')
    .option('--file <path...>', 'Attach file(s) (images, videos, documents, up to 25MB total)')
    .action(async (channelName: string, text: string | undefined, opts) => {
      const fmt = resolveFormat(program.opts().format);
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const ch = await resolveChannel(api, guildId, channelName);

      if (!text && !opts.file) {
        console.error('Provide message text or --file (or both).');
        process.exit(2);
      }

      const payload: MessagePayload = {};
      if (text) payload.content = text;
      if (opts.reply) {
        payload.message_reference = { message_id: opts.reply };
      }

      let msg;
      if (opts.file) {
        const filePaths = (opts.file as string[]).map((f: string) => resolve(f));
        for (const fp of filePaths) {
          if (!existsSync(fp)) {
            console.error(`File not found: ${fp}`);
            process.exit(1);
          }
        }
        msg = await api.sendMessageWithFiles(ch.id, payload, filePaths);
      } else {
        msg = await api.sendMessage(ch.id, payload);
      }

      if (fmt !== 'table') {
        printResult(msg, fmt);
      } else {
        const fileCount = opts.file ? (opts.file as string[]).length : 0;
        const fileInfo = fileCount > 0 ? ` with ${fileCount} file(s)` : '';
        console.log(`Sent message to #${ch.name}${fileInfo} (${msg.id})`);
      }
    });

  message
    .command('embed')
    .description('Send an embed (rich card) to a channel')
    .argument('<channel>', 'Channel name or ID')
    .option('--title <text>', 'Embed title')
    .option('--description <text>', 'Embed description (supports markdown)')
    .option('--color <hex>', 'Embed color (e.g. #5865F2)')
    .option('--url <url>', 'Title link URL')
    .option('--image <url>', 'Large image URL')
    .option('--thumbnail <url>', 'Small thumbnail URL')
    .option('--footer <text>', 'Footer text')
    .option('--author <name>', 'Author name')
    .option('--field <value...>', 'Add field: "Name|Value" or "Name|Value|inline"')
    .option('--content <text>', 'Text content above the embed')
    .option('--reply <id>', 'Reply to a message ID')
    .action(async (channelName: string, opts) => {
      const fmt = resolveFormat(program.opts().format);
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const ch = await resolveChannel(api, guildId, channelName);

      const embed: Embed = {};
      const localFiles: string[] = [];

      if (opts.title) embed.title = opts.title;
      if (opts.description) embed.description = opts.description;
      if (opts.color) embed.color = parseColor(opts.color);
      if (opts.url) embed.url = opts.url;
      if (opts.image) {
        const imgPath = resolve(opts.image);
        if (existsSync(imgPath)) {
          localFiles.push(imgPath);
          embed.image = { url: `attachment://${opts.image.split('/').pop().split('\\').pop()}` };
        } else {
          embed.image = { url: opts.image };
        }
      }
      if (opts.thumbnail) {
        const thumbPath = resolve(opts.thumbnail);
        if (existsSync(thumbPath)) {
          localFiles.push(thumbPath);
          embed.thumbnail = { url: `attachment://${opts.thumbnail.split('/').pop().split('\\').pop()}` };
        } else {
          embed.thumbnail = { url: opts.thumbnail };
        }
      }
      if (opts.footer) embed.footer = { text: opts.footer };
      if (opts.author) embed.author = { name: opts.author };
      if (opts.field) {
        embed.fields = (opts.field as string[]).map((f: string) => {
          const parts = f.split('|');
          return {
            name: parts[0],
            value: parts[1] || '',
            inline: parts[2] === 'inline',
          };
        });
      }

      if (!embed.title && !embed.description) {
        console.error('Provide at least --title or --description for the embed.');
        process.exit(2);
      }

      const payload: MessagePayload = { embeds: [embed] };
      if (opts.content) payload.content = opts.content;
      if (opts.reply) payload.message_reference = { message_id: opts.reply };

      let msg;
      if (localFiles.length > 0) {
        msg = await api.sendMessageWithFiles(ch.id, payload, localFiles);
      } else {
        msg = await api.sendMessage(ch.id, payload);
      }

      if (fmt !== 'table') {
        printResult(msg, fmt);
      } else {
        console.log(`Sent embed to #${ch.name} (${msg.id})`);
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
        if (msg.embeds && msg.embeds.length > 0) {
          for (const e of msg.embeds) {
            if (e.title) console.log(`    [Embed] ${e.title}`);
            if (e.description) console.log(`    ${e.description.slice(0, 100)}`);
          }
        }
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

      const msg = await api.editMessage(ch.id, messageId, { content: text });
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
    .command('bulk-delete')
    .description('Delete multiple recent messages')
    .argument('<channel>', 'Channel name or ID')
    .option('-n <count>', 'Number of messages to delete', '10')
    .option('--confirm', 'Required to actually delete')
    .action(async (channelName: string, opts) => {
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const ch = await resolveChannel(api, guildId, channelName);
      const count = parseInt(opts.n);

      if (!opts.confirm) {
        console.error(`This will delete ${count} messages from #${ch.name}. Add --confirm to proceed.`);
        process.exit(2);
      }

      const messages = await api.getMessages(ch.id, count);
      if (messages.length === 0) {
        console.log('No messages to delete.');
        return;
      }

      const ids = messages.map((m) => m.id);

      if (ids.length === 1) {
        await api.deleteMessage(ch.id, ids[0]);
      } else {
        await api.bulkDeleteMessages(ch.id, ids);
      }

      console.log(`Deleted ${ids.length} message(s) from #${ch.name}`);
    });

  message
    .command('search')
    .description('Search messages in a channel by keyword')
    .argument('<channel>', 'Channel name or ID')
    .argument('<keyword>', 'Keyword to search for')
    .option('-n <count>', 'Max messages to scan', '100')
    .action(async (channelName: string, keyword: string, opts) => {
      const fmt = resolveFormat(program.opts().format);
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const ch = await resolveChannel(api, guildId, channelName);

      const limit = parseInt(opts.n);
      const messages = await api.getMessages(ch.id, Math.min(limit, 100));
      const matches = messages.filter((m) =>
        m.content.toLowerCase().includes(keyword.toLowerCase())
      );

      if (fmt !== 'table') {
        printResult(matches, fmt);
        return;
      }

      if (matches.length === 0) {
        console.log(`No messages matching "${keyword}" in #${ch.name}`);
        return;
      }

      console.log(`\n#${ch.name} — ${matches.length} match(es) for "${keyword}"`);
      console.log('─'.repeat(40));
      for (const msg of matches) {
        const time = new Date(msg.timestamp).toLocaleString();
        console.log(`  ${msg.author.username} — ${time}`);
        console.log(`    ${msg.content}`);
        console.log(`    ID: ${msg.id}`);
        console.log();
      }
    });

  message
    .command('download')
    .description('Download attachments from a message')
    .argument('<channel>', 'Channel name or ID')
    .argument('<message-id>', 'Message ID')
    .option('--output <dir>', 'Output directory', '.')
    .action(async (channelName: string, messageId: string, opts) => {
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const ch = await resolveChannel(api, guildId, channelName);

      const msg = await api.getMessage(ch.id, messageId);
      const attachments = msg.attachments ?? [];

      if (attachments.length === 0) {
        console.error('No attachments found on this message.');
        process.exit(1);
      }

      const outDir = resolve(opts.output);
      if (!existsSync(outDir)) {
        mkdirSync(outDir, { recursive: true });
      }

      for (const att of attachments) {
        const res = await fetch(att.url);
        if (!res.ok) {
          console.error(`Failed to download ${att.filename}: ${res.status}`);
          continue;
        }
        const buffer = Buffer.from(await res.arrayBuffer());
        const outPath = join(outDir, att.filename);
        writeFileSync(outPath, buffer);
        console.log(`Downloaded ${att.filename} (${(att.size / 1024).toFixed(1)}KB) → ${outPath}`);
      }
    });

  message
    .command('react')
    .description('Add a reaction to a message')
    .argument('<channel>', 'Channel name or ID')
    .argument('<message-id>', 'Message ID')
    .argument('<emoji>', 'Emoji to react with (e.g. 👍 or :thumbsup:)')
    .action(async (channelName: string, messageId: string, emoji: string) => {
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const ch = await resolveChannel(api, guildId, channelName);

      await api.addReaction(ch.id, messageId, emoji);
      console.log(`Reacted ${emoji} on message ${messageId} in #${ch.name}`);
    });

  message
    .command('unreact')
    .description('Remove bot reaction from a message')
    .argument('<channel>', 'Channel name or ID')
    .argument('<message-id>', 'Message ID')
    .argument('<emoji>', 'Emoji to remove')
    .action(async (channelName: string, messageId: string, emoji: string) => {
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const ch = await resolveChannel(api, guildId, channelName);

      await api.removeReaction(ch.id, messageId, emoji);
      console.log(`Removed ${emoji} reaction from message ${messageId}`);
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

  message
    .command('thread')
    .description('Create a thread from a message or in a channel')
    .argument('<channel>', 'Channel name or ID')
    .argument('<name>', 'Thread name')
    .option('--message <id>', 'Create thread from this message ID')
    .action(async (channelName: string, name: string, opts) => {
      const fmt = resolveFormat(program.opts().format);
      const api = new DiscordAPI(requireToken());
      const guildId = requireServer(program.opts().server);
      const ch = await resolveChannel(api, guildId, channelName);

      const thread = await api.createThread(ch.id, name, opts.message);
      if (fmt !== 'table') {
        printResult(thread, fmt);
      } else {
        console.log(`Created thread "${name}" in #${ch.name} (${thread.id})`);
      }
    });
}
