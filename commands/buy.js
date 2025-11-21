
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('buy')
        .setDescription('Purchase items from the shop')
        .addStringOption(option =>
            option
                .setName('item')
                .setDescription('The item to purchase')
                .setRequired(true)),

    // Get user data or create a new entry
    getUserData(userId) {
        const userDataPath = path.join(__dirname, '..', 'data', 'chat2earn-users.json');
        let userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));

        if (!userData[userId]) {
            userData[userId] = {
                userId: userId,
                tokens: 0,
                level: 1,
                experience: 0,
                messagesCount: 0,
                lastMessageTime: 0,
                totalTokensEarned: 0,
                achievements: []
            };
            fs.writeFileSync(userDataPath, JSON.stringify(userData, null, 2));
        }

        return userData[userId];
    },

    // Save user data
    saveUserData(userId, data) {
        const userDataPath = path.join(__dirname, '..', 'data', 'chat2earn-users.json');
        let userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
        userData[userId] = data;
        fs.writeFileSync(userDataPath, JSON.stringify(userData, null, 2));
    },

    // Get shop data
    getShopData() {
        const shopPath = path.join(__dirname, '..', 'data', 'chat2earn-shop.json');
        return JSON.parse(fs.readFileSync(shopPath, 'utf8'));
    },

    async execute(interaction) {
        const userId = interaction.user.id;
        const userData = this.getUserData(userId);
        const itemId = interaction.options.getString('item');
        const shopData = this.getShopData();

        // Find the item in roles
        let item = shopData.roles.find(r => r.id === itemId && r.active);
        let itemType = 'role';

        // If not found in roles, check items
        if (!item) {
            item = shopData.items.find(i => i.id === itemId && i.active);
            itemType = 'item';
        }

        // If item still not found
        if (!item) {
            return await interaction.reply({
                content: `Item with ID \`${itemId}\` not found in the shop.`,
                ephemeral: true
            });
        }

        // Check if user has enough tokens
        if (userData.tokens < item.price) {
            return await interaction.reply({
                content: `You don't have enough $GECKURA tokens to purchase this item. You need **${item.price}** $GECKURA, but you only have **${userData.tokens}** $GECKURA.`,
                ephemeral: true
            });
        }

        // Process the purchase
        userData.tokens -= item.price;
        this.saveUserData(userId, userData);

        // Handle different item types
        if (itemType === 'role') {
            if (item.roleId) {
                try {
                    const member = await interaction.guild.members.fetch(userId);
                    await member.roles.add(item.roleId);

                    const embed = new EmbedBuilder()
                        .setTitle('Purchase Successful!')
                        .setColor('#00FF99')
                        .setDescription(`You have successfully purchased the **${item.name}** role!`)
                        .setTimestamp()
                        .setFooter({ text: 'Geckura — Where Innovation Meets Utility!' });

                    await interaction.reply({ embeds: [embed] });
                } catch (error) {
                    console.error('Error assigning role:', error);

                    // Refund tokens if role assignment fails
                    userData.tokens += item.price;
                    this.saveUserData(userId, userData);

                    await interaction.reply({
                        content: 'There was an error assigning the role. Your tokens have been refunded.',
                        ephemeral: true
                    });
                }
            } else {
                // Refund tokens if role ID is not set
                userData.tokens += item.price;
                this.saveUserData(userId, userData);

                await interaction.reply({
                    content: 'This role is not properly configured. Please contact an administrator.',
                    ephemeral: true
                });
            }
        } else {
            // Handle item purchase
            const embed = new EmbedBuilder()
                .setTitle('Purchase Successful!')
                .setColor('#00FF99')
                .setDescription(`You have successfully purchased **${item.name}**!

Please contact an administrator to receive your item.`)
                .addFields(
                    { name: 'Item ID', value: item.id, inline: true },
                    { name: 'Price Paid', value: `${item.price} $GECKURA`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Geckura — Where Innovation Meets Utility!' });

            await interaction.reply({ embeds: [embed] });

            // Notify admins about the purchase
            try {
                const adminChannel = interaction.guild.channels.cache.find(c => c.name === 'admin' || c.name === 'staff');
                if (adminChannel) {
                    const adminEmbed = new EmbedBuilder()
                        .setTitle('New Item Purchase!')
                        .setColor('#FFD700')
                        .setDescription(`**${interaction.user.username}** has purchased **${item.name}**`)
                        .addFields(
                            { name: 'User ID', value: interaction.user.id, inline: true },
                            { name: 'Item ID', value: item.id, inline: true },
                            { name: 'Price', value: `${item.price} $GECKURA`, inline: true }
                        )
                        .setTimestamp()
                        .setFooter({ text: 'Geckura — Where Innovation Meets Utility!' });

                    await adminChannel.send({ embeds: [adminEmbed] });
                }
            } catch (error) {
                console.error('Error notifying admins:', error);
            }
        }
    }
};
