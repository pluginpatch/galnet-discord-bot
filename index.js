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
const db = new Database('galnet-discord-bot.db', { verbose: console.log });
db.prepare("CREATE TABLE IF NOT EXISTS servers('guild_id' varchar PRIMARY KEY, 'channel_id' varchar, 'active' bool, 'mention' varchar, 'language' varchar);").run();

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

// Check for a new article every 4th, 19th, 34th, and 49th minute
let get_news = new cron.CronJob("* * * * *", async () => {
  let start_date_time = Date.now()
  https.get("https://cms.zaonce.net/en-GB/jsonapi/node/galnet_article?&sort=-published_at&page[offset]=0&page[limit]=1", (response) => {
    let data = "";
    response.setEncoding("utf8");
    response.on("data", (chunk) => {
      data += chunk;
    });
    response.on("end", () => {
      var article = JSON.parse(data);
      console.log("[" + toDateTime(start_date_time) + "] Latest Sync: " + toDateTime(latest_sync));
      // Did we get any data
      if(article.data && article.data[0]) {
        // Is the data more recent than the last sync
        if(Date.parse(article.data[0].attributes.published_at) <= latest_sync) {
          console.log("[" + toDateTime(start_date_time) + "] New article found! Published at: " + toDateTime(Date.parse(article.data[0].attributes.published_at)))
          var title = "__**" + article.data[0].attributes.title + "**__\n";
          var date = "_" + article.data[0].attributes.field_galnet_date + "_\n";
          var link = "https://community.elitedangerous.com/galnet/uid/" + article.data[0].attributes.field_galnet_guid + "\n";
          var body = ">>> " + article.data[0].attributes.body.value;
          body = body.replace(/(\*|_|`|~|\\)/g, '\\$1');
          var message = title.concat(date, link, body);
          post(message)
        }
        // Set the latest sync
        latest_sync = start_date_time
      } else {
        // we received no data, skip this time
        console.log("[" + toDateTime(Date.now()) + "] Received no data, skipping this run.")
      }
    });
  }).on("error", (err) => {
    console.log("Error: " + err.message);
  });
});

// Post to servers
async function post(content) {
  console.log(Date.now() + " Updating all servers with new article.")
  console.log("New article to post: " + content);
  var servers = db.prepare("SELECT * FROM servers;").all();
  servers.forEach((server) => {
    let channel = client.channels.cache.get(server.channel_id);
    // If Channel exists, post
    if(channel) {
      const messageChunks = Util.splitMessage(content, {
        maxLength: 2000,
        prepend: '>>> ',
        char: '\n'
      });
      messageChunks.forEach(async chunk => {
        await channel.send(chunk);
      });
      //channel.send(content).catch(console.error);
      console.log("[" + toDateTime(Date.now()) + "] Posting to channel: " + server.channel_id)
    }
    else {
      console.log("[" + toDateTime(Date.now()) + "] Failed getting channel: " + server.channel_id);
    }
  });
};

// Commands via channelUpdate
client.on("channelUpdate", async function(old_channel, new_channel) {
  if(new_channel.topic && new_channel.topic.includes("galnet-news on")) {
    client.channels.cache.get(new_channel.id).send("Galnet News articles will be synced to this channel.\nUpdate the channel topic with `galnet-news off` (or kick the bot) to stop.\nYou can delete this message and remove the channel topic now, if desired.").catch(console.error);
    console.log("[" + toDateTime(Date.now()) + "] Adding guild to servers list: " + new_channel.guild.id);
    db.prepare("INSERT OR REPLACE INTO servers (guild_id, channel_id, language) VALUES (?, ?, 'en-GB');").run(new_channel.guild.id, new_channel.id);
  }
  if(new_channel.topic && new_channel.topic.includes("galnet-news off")) {
    client.channels.cache.get(new_channel.id).send("Galnet News article sync stopped for this channel.\nUpdate the channel topic with `galnet-news on` to resume article sync.\nYou can delete this message and remove the channel topic now, if desired.").catch(console.error);
    console.log("[" + toDateTime(Date.now()) + "] Removing guild from servers list: " + new_channel.guild.id);
    db.prepare("DELETE FROM servers WHERE guild_id = ?;").run(new_channel.guild.id);
  }
});

// Remove guild and channel when the bot is removed from the guild.
client.on("guildDelete", function(guild){
  console.log("[" + toDateTime(Date.now()) + "] Removing guild from servers list because kicked: " + guild.id);
  db.prepare("DELETE FROM servers WHERE guild_id = ?;").run(guild.id);
});

client.login(token);
