# Discord Bot Setup Guide

Step-by-step guide to create a Discord bot for use with discli.

## 1. Create an Application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application** (top right)
3. Give it a name (this is the app name, not the bot name)
4. Click **Create**

## 2. Create the Bot

1. In your application, go to the **Bot** tab (left sidebar)
2. You should see a bot was auto-created with your app
3. Click **Reset Token** and copy the token somewhere safe -- you'll need it later
4. **Do not share this token with anyone.** It gives full access to your bot.

## 3. Enable Message Content Intent

This is required for your bot to read message content from other users.

1. Still on the **Bot** tab, scroll down to **Privileged Gateway Intents**
2. Enable **Message Content Intent**
3. Click **Save Changes**

Without this, your bot can only read its own messages. Other users' messages will show as empty.

## 4. Set Bot Permissions

Still on the **Bot** tab, under **Bot Permissions**, you have two options:

**Option A: Administrator (simple)**
Check **Administrator**. This gives your bot full access to everything. Easiest option if this is your own server.

**Option B: Specific permissions (more secure)**
Check only what you need:
- **Manage Channels** -- create, rename, delete, move channels
- **Manage Roles** -- create, edit, delete, assign roles
- **Manage Server** -- change server name, icon, settings
- **Manage Messages** -- delete messages, bulk delete, pin/unpin
- **Send Messages** -- send messages and embeds
- **Attach Files** -- upload files and images
- **Read Message History** -- read past messages
- **Add Reactions** -- react to messages
- **Manage Emojis and Stickers** -- upload, delete custom emojis
- **Create Invite** -- create server invites
- **View Audit Log** -- read audit log entries
- **Kick Members** -- kick members
- **Ban Members** -- ban members
- **Manage Nicknames** -- change member nicknames
- **View Channel** -- see channels and read messages

Some discli commands won't work without the matching permission. The error message will tell you which one is missing.

## 5. Set Up Installation

1. Go to the **Installation** tab (left sidebar)
2. Under **Installation Contexts**, check **Guild Install** (uncheck User Install unless you need it)
3. Under **Default Install Settings** for Guild Install:
   - **Scopes**: select `bot` and `applications.commands`
   - **Permissions**: select the same permissions from step 4
4. Click **Save Changes**

## 6. Add the Bot to Your Server

1. Still on the **Installation** tab, you'll see an **Install Link** at the top
2. Copy that link and open it in your browser
3. Select the server you want to add the bot to
4. Review the permissions and click **Authorize**

If you don't see your server in the dropdown, make sure you have **Manage Server** permission in that Discord server.

## 7. Configure discli

Now that your bot is in your server, set up discli:

```bash
# Install discli
npm install -g @ibbybuilds/discli

# Set your bot token
discli init --token YOUR_TOKEN_HERE

# List servers to verify it works
discli server list

# Set your default server
discli server select SERVER_ID

# You're ready
discli channel list
```

## Troubleshooting

**"403 Forbidden -- missing permissions"**
Your bot doesn't have the required permission for that action. Either give it Administrator or add the specific permission in the Developer Portal, then re-invite the bot.

**Messages show empty content**
You haven't enabled **Message Content Intent** (step 3). Go to the Bot tab in the Developer Portal and enable it.

**"Not configured. Run discli init first"**
You haven't set your token yet. Run `discli init --token YOUR_TOKEN`.

**Bot not showing in server**
Make sure you completed step 6 and selected the correct server. The bot should appear in the member list (it may show as offline, that's normal -- discli doesn't need the bot to be online).

**"Rate limited"**
Discord allows about 5 requests per second. If you're running many commands in a row, slow down slightly. Channel renames have a stricter limit of 2 per 10 minutes per channel.

**Can't see my server in the authorize dropdown**
You need **Manage Server** permission in the Discord server to add bots.

## Security Tips

- Never commit your bot token to source code or git
- discli stores your token locally in `~/.discli/.env`
- If your token is ever exposed, go to the Developer Portal and click **Reset Token** immediately
- Use specific permissions instead of Administrator if you want tighter security
- When using with AI agents, always review commands before approving destructive actions (delete, kick, ban)
