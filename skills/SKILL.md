---
name: dctl
description: |
  Discord server management CLI. Use when you need to manage Discord servers —
  create channels, assign roles, manage members, rename channels, set permissions.
  Run dctl --help or dctl <command> --help to discover subcommands.
---

# dctl — Discord Server Management CLI

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
dctl init --token <token>           # First-time setup
dctl server list                    # List servers
dctl server select <id>             # Set default server
dctl server info                    # Server overview

dctl channel list                   # List channels
dctl channel create <name>          # Create channel (--type, --category, --topic)
dctl channel delete <name>          # Delete channel (--confirm required)
dctl channel rename <ch> <name>     # Rename channel
dctl channel topic <ch> <text>      # Set topic
dctl channel move <ch>              # Move to category (--category, --position)

dctl role list                      # List roles
dctl role create <name>             # Create role (--color, --mentionable)
dctl role delete <name>             # Delete role (--confirm required)
dctl role assign <role> <user>      # Give role to member
dctl role remove <role> <user>      # Remove role from member

dctl member list                    # List members
dctl member info <user>             # Member details
dctl member kick <user>             # Kick (--confirm, --reason)
dctl member ban <user>              # Ban (--confirm, --reason)
dctl member nick <user> <nick>      # Change nickname

dctl perm view <channel>            # View channel permissions
dctl perm set <ch> <role>           # Set permissions (--allow, --deny)
dctl perm lock <channel>            # Make read-only for @everyone
dctl perm unlock <channel>          # Remove read-only
dctl perm list                      # List available permission names
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
- Config stored in `~/.dctl/` (token in `.env`, defaults in `config.json`).
