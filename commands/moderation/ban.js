const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const Keyv = require("keyv");
const keyv = new Keyv("sqlite://database.db");

let bannedUsers = [];
let banList = [];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ban")
        .setDescription("Ban a user from uploading runs to speedrun.com.")
        .addStringOption(option =>
            option.setName("user")
                .setDescription("The speedrun.com username of the user you want to ban.")
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName("reason")
                .setDescription("Reason for ban.")
        ),
    async execute(interaction) {
        bannedUsers = await initializeVariable("banned-users");
        banList = await initializeVariable("ban-list");

        const user = interaction.options.getString("user");
        const reason = interaction.options.getString("reason") ?? "No reason provided.";

        fetch(`https://www.speedrun.com/api/v1/users/${user}`).then(response => {
            if(!response.ok) {
                throw new Error("\nNetwork response not ok: " + response.statusText);
            }

            return response.json();
        }).then(async userData => {
            if(bannedUsers.includes(userData.data.id)) {
                interaction.reply({ content: `${user} is already banned.`, ephemeral: true });
                return;
            }
            
            bannedUsers.push(userData.data.id);
            banList.push(
                {
                    username: user,
                    reason: reason
                }
            );

            await keyv.set("banned-users", bannedUsers);
            await keyv.set("ban-list", banList);

            let banEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle(`A user has been banned.`)
                .setFields(
                    {
                        name: `Username: ${user}`,
                        value: `**Reason:** ${reason}`
                    }
                )
                .setThumbnail("https://cdn.discordapp.com/avatars/1242652099683029023/f03e0a5a88dc165cccb478a0a611e310.webp?size=4096")
                .setTimestamp()
                .setFooter({ text: "ADGAC Bot", iconURL: "https://cdn.discordapp.com/avatars/1242652099683029023/f03e0a5a88dc165cccb478a0a611e310.webp?size=4096" });

            interaction.reply({ embeds: [ banEmbed ] });
        }).catch(error => {
            console.error(error);

            interaction.reply({ content: `${error}`, ephemeral: true });
        });
    }
}

async function initializeVariable(key) {
    let value = [];

    if(await keyv.get(key) == undefined) {
        await keyv.set(key, value);

        return value;
    } else {
        return await keyv.get(key);
    }
}