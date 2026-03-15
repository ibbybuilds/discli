import { Command } from 'commander';
import { saveToken, setDefaultServer, loadToken } from '../utils/config.js';
import { DiscordAPI } from '../utils/api.js';
import { readFileSync } from 'fs';

export function registerInit(program: Command): void {
  program
    .command('init')
    .description('Set up discli with your bot token and default server')
    .option('--token <token>', 'Bot token (or reads from stdin)')
    .action(async (opts) => {
      let token = opts.token;

      if (!token) {
        // Try reading from stdin if piped
        if (!process.stdin.isTTY) {
          token = readFileSync(0, 'utf-8').trim();
        }
      }

      if (!token) {
        // Check if already configured
        const existing = loadToken();
        if (existing) {
          console.log('Already configured. Use --token to update.');
          token = existing;
        } else {
          console.error('Usage: discli init --token <your-bot-token>');
          console.error('  Get your token from https://discord.com/developers/applications');
          process.exit(2);
        }
      }

      // Validate token
      const api = new DiscordAPI(token);
      let guilds;
      try {
        guilds = await api.listGuilds();
      } catch {
        console.error('Invalid token or cannot connect to Discord.');
        process.exit(1);
      }

      saveToken(token);
      console.log(`Token saved to ~/.discli/.env`);

      if (guilds.length === 0) {
        console.log('Bot is not in any servers yet. Add it to a server first.');
        return;
      }

      console.log('\nServers:');
      guilds.forEach((g, i) => {
        console.log(`  ${i + 1}. ${g.name} (${g.id})`);
      });

      // Auto-select if only one server
      if (guilds.length === 1) {
        setDefaultServer(guilds[0].id, guilds[0].name);
        console.log(`\nDefault server: ${guilds[0].name}`);
      } else {
        console.log(`\nSet default with: discli server select <id>`);
      }

      console.log('\nReady! Try: discli server info');
    });
}
