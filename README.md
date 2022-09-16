# Galnet Discord Bot

Discord bot to post Galnet News from Elite: Dangerous. This bot will check Galnet four times an hour for a new article and post to any subscribed Discord servers.

![Example Image of Bot](/how-to/example_image.jpg?raw=true)

## Add the Bot to your Server

1. [Invite the Bot to your Server](https://discord.com/api/oauth2/authorize?client_id=937466947975651378&permissions=150528&scope=bot)
2. Give the bot the necessary permissions to post
3. Edit the channel you want the bot to sync to

![Editing channel](/how-to/edit_channel.jpg?raw=true)

4. Add `galnet-news on` to the channel's topic
  * Include the language code to sync with a different language. Example: `galnet-news on fr-FR`

![Editing channel topic](/how-to/update_topic.jpg?raw=true)

5. Save the change

![Saving changes](/how-to/save_changes.jpg?raw=true)

6. You should see a notification from the bot letting you know that it is synced to the channel. If you don't see this message, it likely can't post to your channel, please check your permissions again. You can remove the command from the channel's topic and delete the message from the bot now.

Done!

### Language Preference
Language preference is here. The Galnet News API doesn't support a lot of languages, but this should cover some popular languages.

Add the language code to the channel's topic like: `galnet-news on de-DE`

Available language codes:
* English (Default): `en-GB`
* German: `de-DE`
* French: `fr-FR`
* Spanish: `es-ES`
* Portuguese: `pt-BR`
* Italian: `it-IT`
* Dutch: `nl-NL`
* Russian: `ru-RU`

I've noticed that some of these still show up as English, but that is how Frontier provides it.

### Bot Commands

* *Post Latest Article Now*: Add `galnet-news post-now` to your channel topic. This will post the current article now using the language configuration. This will continue to post if you update your channel, you will need to remove it if you don't want it to post more.

### Why are you using the commands in the channel topic?

Since this bot has very limited interaction, it seemed like a waste to monitor all messages in the discord server. So instead, the bot will monitor updates to your channels.

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

1. Pull the repo `git clone https://github.com/pluginpatch/galnet-discord-bot.git`
2. In the repo directory, run `npm update`
3. Get your discord bot token https://discordapp.com/developers/applications/
4. Create a file called `token.json` with your token in the repo directory:
```
{
  "token": "<Your Token>"
}
```
5. In the repo directory, run `npm start`
