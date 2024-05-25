const { Events } = require("discord.js");
const path = require("node:path");

const simpleGit = require("simple-git");
const git = simpleGit(path.resolve(__dirname + "./../"));

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        try {
            await git.pull();
        } catch(error) {
            console.error("Failed to git pull:", error)
        }

        console.log(`Ready! Logged in as ${client.user.tag}`);
    }
};