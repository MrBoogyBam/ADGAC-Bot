const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const Keyv = require("keyv");
const keyv = new Keyv("sqlite://database.db");

let bannedUsers = [];
let banList = [];

let modRoles = [
    "1237987632315633665", // Verifier
    "1236458340708646942", // Mod
    "1236458128476999690" // Super Mod
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("unban")
        .setDescription("Unban a user, Regranting them permission to submit runs to speedrun.com.")
        .addStringOption(option =>
            option.setName("user")
                .setDescription("The speedrun.com username of the user you want to unban.")
                .setRequired(true)
        ),
    async execute(interaction) {
        if(!modRoles.some(role => interaction.member.roles.cache.has(role))) {
            interaction.reply({ content: "You do not have the permissions to use this command.", ephemeral: true });
            return;
        }

        bannedUsers = await initializeVariable("banned-users");
        banList = await initializeVariable("ban-list");

        const user = interaction.options.getString("user");

        fetch(`https://www.speedrun.com/api/v1/users/${user}`).then(response => {
            if(!response.ok) {
                throw new Error("\nNetwork response not ok: " + response.statusText);
            }

            return response.json();
        }).then(async userData => {
            if(!bannedUsers.includes(userData.data.id)) {
                await interaction.reply({ content: `${user} is not banned.`, ephemeral: true });
                return;
            }

            const userIndex = bannedUsers.indexOf(userData.data.id);
            bannedUsers.splice(userIndex, 1);

            const listIndex = banList.findIndex(usr => usr.username == user);
            banList.splice(listIndex, 1);

            await keyv.set("banned-users", bannedUsers);
            await keyv.set("ban-list", banList);

            let unbanEmbed = new EmbedBuilder()
                .setColor(0x21ffc6)
                .setTitle(`A user has been unbanned.`)
                .setFields(
                    {
                        name: `Username: ${user}`,
                        value: "\u200B"
                    }
                )
                .setThumbnail("https://cdn.discordapp.com/avatars/1242652099683029023/f03e0a5a88dc165cccb478a0a611e310.webp?size=4096")
                .setTimestamp()
                .setFooter({ text: "ADGAC Bot", iconURL: "https://cdn.discordapp.com/avatars/1242652099683029023/f03e0a5a88dc165cccb478a0a611e310.webp?size=4096" });

            interaction.reply({ embeds: [ unbanEmbed ] });
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