# Galnet Discord Bot
Discord bot to post Galnet News from Elite: Dangerous. This bot will check Galnet four times an hour for a new article and post to any subscribed Discord servers.

![Example Image of Bot](/how-to/example_image.jpg?raw=true)

## Add the Bot to your Server

1. [Invite the Bot to your Server](https://discord.com/api/oauth2/authorize?client_id=937466947975651378&permissions=150528&scope=bot)
2. Give the bot the necessary permissions to post
3. Edit the channel you want the bot to sync to

![Editing channel](/how-to/edit_channel.jpg?raw=true)

4. Add `galnet-news on` to the channel's topic

![Editing channel topic](/how-to/update_topic.jpg?raw=true)

5. Save the change

![Saving changes](/how-to/save_changes.jpg?raw=true)

6. You can remove the command from the channel's topic now

Done!

### Why are you using the commands in the channel topic?

Since this bot has very limited interaction, it seemed like a waste to monitor all messages in the discord server.

## Stop Receiving Posts

1. Edit the channel
2. Add `galnet-news off` to the channel's topic, save the change
3. You can remove the command from the channel's topic now

# Host Your Own Bot
The bot is running on nodejs and discordjs. You can host this on any computer and it's very lightweight.

## Requirements
* discord.js
* better-sqlite3
* cron
* https

## Setup

1. Pull the repo `git clone https://github.com/jakecsells/galnet-discord-bot.git`
2. In the repo directory, run `npm update`
3. Get your discord bot token https://discordapp.com/developers/applications/
4. Create a file called `token.json` with your token in the repo directory:
```
{
  "token": "<Your Token>"
}
```
5. In the repo directory, run `npm start`
