const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const Keyv = require("keyv");
const keyv = new Keyv("sqlite://database.db");

let banList = [];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("banlist")
        .setDescription("Lists all users banned from uploading to speedrun.com"),
    async execute(interaction) {
        if(await keyv.get("ban-list") == undefined) {
            banList = []

            keyv.set("ban-list", banList);
        } else {
            banList = await keyv.get("ban-list");
        }
        
        if(banList.length == 0) {
            interaction.reply({ content: "The ban list is empty.", ephemeral: true });
        } else {
            let listEmbed = new EmbedBuilder()
                .setColor(0xd4a0f1)
                .setTitle("ADGAC's Speedrun.com Ban List")
                .setDescription("This list shows all of the users banned from uploading runs to ADGAC's speedrun.com page.")
                .setThumbnail("https://cdn.discordapp.com/avatars/1242652099683029023/f03e0a5a88dc165cccb478a0a611e310.webp?size=80")
                .setTimestamp()
                .setFooter({ text: "ADGAC Bot", iconURL: "https://cdn.discordapp.com/avatars/1242652099683029023/f03e0a5a88dc165cccb478a0a611e310.webp?size=4096" });

            for(const user of banList) {
                listEmbed.addFields(
                    {
                        name: `Username: ${user.username}`,
                        value: `**Reason:** ${user.reason}`
                    }
                );
            }

            interaction.reply({ embeds: [ listEmbed ], ephemeral: true });
        }
    }
}