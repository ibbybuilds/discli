---
name: discli
description: |
  Discord server management CLI. Use when you need to manage Discord servers —
  create channels, assign roles, manage members, rename channels, set permissions.
  Run discli --help or discli <command> --help to discover subcommands.
---

# discli — Discord Server Management CLI

Control Discord servers from the terminal. Works for both humans and AI agents.

## Agent Defaults

- Output is auto-detected: JSON when piped (agent), table in terminal (human).
- Use `-n` to limit results and keep token usage low.
- Use `--format json` to force structured output.
- Use `--dry-run` on create/rename/permission commands to preview changes.
- Destructive commands (delete, kick, ban) require `--confirm` — they will NOT prompt.
- See SCHEMA.md for exact JSON output shapes.

## Quick Reference

```bash
discli init --token <token>           # First-time setup
discli server list                    # List servers
discli server select <id>             # Set default server
discli server info                    # Server overview

discli channel list                   # List channels
discli channel create <name>          # Create channel (--type, --category, --topic)
discli channel delete <name>          # Delete channel (--confirm required)
discli channel rename <ch> <name>     # Rename channel
discli channel topic <ch> <text>      # Set topic
discli channel move <ch>              # Move to category (--category, --position)

discli role list                      # List roles
discli role create <name>             # Create role (--color, --mentionable)
discli role delete <name>             # Delete role (--confirm required)
discli role assign <role> <user>      # Give role to member
discli role remove <role> <user>      # Remove role from member

discli member list                    # List members
discli member info <user>             # Member details
discli member kick <user>             # Kick (--confirm, --reason)
discli member ban <user>              # Ban (--confirm, --reason)
discli member nick <user> <nick>      # Change nickname

discli perm view <channel>            # View channel permissions
discli perm set <ch> <role>           # Set permissions (--allow, --deny)
discli perm lock <channel>            # Make read-only for @everyone
discli perm unlock <channel>          # Remove read-only
discli perm list                      # List available permission names
```

## Global Flags

- `--format <json|table|auto>` — output format (default: auto)
- `--server <id>` — target a specific server instead of default
- `-n <count>` — limit results on list commands

## Exit Codes

- `0` — success
- `1` — general error
- `2` — usage error
- `3` — not found
- `4` — permission denied

## Notes

- Channel/role/member names are resolved case-insensitively.
- You can use IDs instead of names to avoid ambiguity.
- Rate limits: Discord allows ~5 requests/second. Channel renames have a 10-min cooldown per channel.
- Config stored in `~/.discli/` (token in `.env`, defaults in `config.json`).
