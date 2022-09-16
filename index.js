// Discord setup
const { token } = require("./token.json");
const { Client, Intents, Util } = require("discord.js");
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});

// Other setup
const fs = require("fs");
const https = require("https");
const cron = require("cron");
const Database = require('better-sqlite3');

// Create/Connect DB
const db = new Database('galnet-discord-bot.db');
db.prepare("CREATE TABLE IF NOT EXISTS servers('guild_id' varchar PRIMARY KEY, 'channel_id' varchar, 'active' bool, 'mention' varchar, 'language' varchar, 'last_sync' datetime);").run();

// Variables
var latest_sync = Date.now()

function toDateTime(date_time) {
  const date_time_format = new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC'
  });
  return date_time_format.format(new Date(date_time));
}

client.on("ready", () => {
  console.log("I am ready!");
  get_news.start();
});

// Check for a new article every 7th and 37th minute
let get_news = new cron.CronJob("7,22,37,52 * * * *", async () => {
  console.log("[" + toDateTime(Date.now()) + "] Checking for new articles");
  let start_date_time = Date.now();
  var languages = db.prepare("SELECT DISTINCT language FROM servers;").all();
  languages.forEach((language) => {
    // Get the latest article in that language
    get_latest_article(language.language)
    .then((result) => {
      // Check if we received any data, if not skip this run
      if(result.message) {
        var servers = db.prepare(`SELECT * FROM servers WHERE language = '${language.language}';`).all();
        servers.forEach((server) => {
          if(result.published_at >= server.last_sync) {
            // This article is newer than the latest sync - post article
            post(server.channel_id, result.message);
          }
          // Update the last_sync in the DB to the start time of the sync
          db.prepare(`UPDATE servers SET last_sync = ? WHERE guild_id = ?;`).run(start_date_time, server.guild_id);
        });
      }
    })
    .catch((error) => {
      console.log("[" + toDateTime(Date.now()) + "] Error: " + error)
    });
  });
});

function get_latest_article(language) {
  return new Promise(resolve => {
    https.get(`https://cms.zaonce.net/${language}/jsonapi/node/galnet_article?&sort=-published_at&page[offset]=0&page[limit]=1`, (response) => {
      let data = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        data += chunk;
      });
      response.on("end", () => {
        var article = JSON.parse(data);
        // Did we get any data
        if(article.data && article.data[0]) {
          let title = "__**" + article.data[0].attributes.title + "**__\n";
          let date = "_" + article.data[0].attributes.field_galnet_date + "_\n";
          let link = `https://community.elitedangerous.com/${article.data[0].attributes.langcode}/galnet/uid/` + article.data[0].attributes.field_galnet_guid + "\n";
          let body = ">>> " + article.data[0].attributes.body.value;
          body = body.replace(/(\*|_|`|~|\\)/g, '\\$1');
          let message = title.concat(date, link, body);
          let published_at = Date.parse(article.data[0].attributes.published_at);
          resolve({published_at, message});
        } else {
          // we received no data, skip this time
          console.log("[" + toDateTime(Date.now()) + "] Received no data, skipping this run.");
          resolve(false);
        }
      });
    }).on("error", (error) => {
      console.log("[" + toDateTime(Date.now()) + "] Error: " + error.message);
      resolve(false);
    });
  });
};

// Post to channel
function post(channel_id, content) {
  let channel = client.channels.cache.get(channel_id);
  // If Channel exists, post
  if(channel) {
    console.log("[" + toDateTime(Date.now()) + "] Posting article: {guild: \"" + channel.guild.name + "\", channel: \"" + channel.name + "\"}");
    const messageChunks = Util.splitMessage(content, {
      maxLength: 2000,
      prepend: '>>> ',
      char: '\n'
    });
    messageChunks.forEach(async chunk => {
      await channel.send(chunk);
    });
  }
  else {
    console.log("[" + toDateTime(Date.now()) + "] Failed getting channel: " + channel_id);
  }
};

// Commands via channelUpdate
client.on("channelUpdate", async function(old_channel, new_channel) {
  // Create/Update channel sync
  if(new_channel.topic && new_channel.topic.includes("galnet-news on")) {
    var language = "en-GB"
    // Checking language
    if(new_channel.topic.toLowerCase().includes("en-gb")) {language = "en-GB"}
    else if(new_channel.topic.toLowerCase().includes("de-de")) {language = "de-DE"} // German
    else if(new_channel.topic.toLowerCase().includes("fr-fr")) {language = "fr-FR"} // French
    else if(new_channel.topic.toLowerCase().includes("pt-br")) {language = "pt-BR"} // Portuguese
    else if(new_channel.topic.toLowerCase().includes("pl-pl")) {language = "pl-PL"} // Polish
    else if(new_channel.topic.toLowerCase().includes("ru-ru")) {language = "ru-RU"} // Russian
    else if(new_channel.topic.toLowerCase().includes("es-es")) {language = "es-ES"} // Spanish
    else if(new_channel.topic.toLowerCase().includes("nl-nl")) {language = "nl-NL"} // Dutch
    else if(new_channel.topic.toLowerCase().includes("it-it")) {language = "it-IT"} // Italian
    else {language = "en-GB"}
    client.channels.cache.get(new_channel.id).send(`Galnet News articles will be synced to this channel. Using the language code: ${language}.\nUpdate the channel topic with \`galnet-news off\` (or kick the bot) to stop.\nYou can delete this message and remove the channel topic now, if desired.`).catch(console.error);
    console.log("[" + toDateTime(Date.now()) + "] Adding guild: {guild_id: \"" + new_channel.guild.id + "\", guild_name: \"" + new_channel.guild.name + "\", channel_name: \"" + new_channel.name + "\", language: \"" + language + "\"}");
    db.prepare(`INSERT OR REPLACE INTO servers (guild_id, channel_id, active, language, last_sync) VALUES (?, ?, true, ?, ?);`).run(new_channel.guild.id, new_channel.id, language, Date.now());
  }
  // Command: Turn off sync
  if(new_channel.topic && new_channel.topic.includes("galnet-news off")) {
    client.channels.cache.get(new_channel.id).send("Galnet News article sync stopped for this channel.\nUpdate the channel topic with `galnet-news on` to resume article sync.\nYou can delete this message and remove the channel topic now, if desired.").catch(console.error);
    console.log("[" + toDateTime(Date.now()) + "] Removing guild from servers list: " + new_channel.guild.id);
    db.prepare("DELETE FROM servers WHERE guild_id = ?;").run(new_channel.guild.id);
  }
  // Command: Post article now
  if(new_channel.topic && new_channel.topic.includes("galnet-news post-now")) {
    // client.channels.cache.get(new_channel.id).send("Galnet News article sync stopped for this channel.\nUpdate the channel topic with `galnet-news on` to resume article sync.\nYou can delete this message and remove the channel topic now, if desired.").catch(console.error);
    const row = db.prepare("SELECT * FROM servers WHERE guild_id = ?;").get(new_channel.guild.id);
    console.log(row.guild_id, row.channel_id, row.language);
    get_latest_article(row.language)
    .then((result) => {
      // Check if we received any data, if not skip this run
      if(result.message) {
        post(row.channel_id, result.message);
        db.prepare(`UPDATE servers SET last_sync = ? WHERE guild_id = ?;`).run(Date.now(), row.guild_id);
      }
    })
    .catch((error) => {
      console.log("[" + toDateTime(Date.now()) + "] Error: " + error)
    });

  }
});

// Remove guild and channel when the bot is removed from the guild.
client.on("guildDelete", function(guild){
  console.log("[" + toDateTime(Date.now()) + "] Removing guild from servers list because kicked: " + guild.id);
  db.prepare("DELETE FROM servers WHERE guild_id = ?;").run(guild.id);
});

client.login(token);
