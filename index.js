const fs = require("node:fs");
const path = require("node:path");
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { prefix, token, authentication } = require('./config.json');
const client = new Client({ intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent ] });

const Keyv = require("keyv");
const keyv = new Keyv("sqlite://database.db");

let bannedUsers = [];

const rejectedData = {
    status: {
        status: "rejected",
        reason: "User is banned from submitting runs to A Difficult Game About Climbing."
    }
};

client.commands = new Collection();

const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for(const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

    for(const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        if("data" in command && "execute" in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));

for(const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);

    if(event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

setInterval(() => {
    fetch("https://www.speedrun.com/api/v1/runs?game=y65ro341&max=200&orderby=date&direction=desc").then(response => {
        if(!response.ok) {
            throw new Error("\nNetwork response not ok: " + response.statusText);
        }

        return response.json();
    }).then(async runsData => {
        if(await keyv.get("banned-users") == undefined) {
            bannedUsers = []

            keyv.set("banned-users", );
        } else {
            bannedUsers = await keyv.get("banned-users");
        }

        Object.values(runsData.data).forEach((runValue, _) => {
            if(runValue.status.status == "new" && bannedUsers.includes(runValue.players[0].id)) {
                fetch(`https://www.speedrun.com/api/v1/runs/${runValue.id}/status`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "X-API-Key": authentication
                    },
                    body: JSON.stringify(rejectedData)
                }).then(response => {
                    if(!response.ok) {
                        throw new Error("Failed to update run status: " + response.statusText);
                    }
                }).catch(error => {
                    console.error(error);
                });
            }
        });
    }).catch(error => {
        console.error(error);
    });
}, 120000);

client.login(token);