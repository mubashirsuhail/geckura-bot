const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Open the $GECKURA token shop'),

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

    // Get shop data
    getShopData() {
        const shopPath = path.join(__dirname, '..', 'data', 'chat2earn-shop.json');
        return JSON.parse(fs.readFileSync(shopPath, 'utf8'));
    },

    // Save purchase history
    savePurchaseHistory(userId, item) {
        const historyPath = path.join(__dirname, '..', 'data', 'purchase-history.json');
        let history = [];

        if (fs.existsSync(historyPath)) {
            history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
        }

        history.push({
            userId: userId,
            itemId: item.id,
            itemName: item.name,
            price: item.price,
            timestamp: Date.now()
        });

        fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
    },

    async execute(interaction) {
        const shopData = this.getShopData();
        const userId = interaction.user.id;
        const userData = this.getUserData(userId);

        const embed = new EmbedBuilder()
            .setTitle('$GECKURA Token Shop')
            .setColor('#FFD700')
            .setDescription(`Your balance: **${userData.tokens} $GECKURA**

Use the buttons below to navigate the shop.`)
            .setTimestamp()
            .setFooter({ text: 'Geckura — Where Innovation Meets Utility!' });

        // Add roles to shop
        if (shopData.roles && shopData.roles.length > 0) {
            let roleList = '';
            shopData.roles.forEach(role => {
                if (role.active) {
                    roleList += `**${role.name}** - ${role.price} $GECKURA
${role.description}
ID: \`${role.id}\`

`;
                }
            });

            if (roleList) {
                embed.addFields({ name: '👑 Roles', value: roleList });
            }
        }

        // Add items to shop
        if (shopData.items && shopData.items.length > 0) {
            let itemList = '';
            shopData.items.forEach(item => {
                if (item.active) {
                    itemList += `**${item.name}** - ${item.price} $GECKURA
${item.description}
ID: \`${item.id}\`

`;
                }
            });

            if (itemList) {
                embed.addFields({ name: '🎁 Items', value: itemList });
            }
        }

        // Create buttons
        const row = new ActionRowBuilder();

        // Add shop now button
        const shopNowButton = new ButtonBuilder()
            .setCustomId('shop-now')
            .setLabel('Shop Now')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🛒');

        // Add shop history button
        const shopHistoryButton = new ButtonBuilder()
            .setCustomId('shop-history')
            .setLabel('Shop History')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📜');

        // Add buttons to row
        row.addComponents(shopNowButton, shopHistoryButton);

        await interaction.reply({ embeds: [embed], components: [row] });

        // Create a collector for button interactions
        const filter = i => i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'shop-now') {
                // Create dropdown for item selection
                const selectRow = new ActionRowBuilder();

                // Create options for the dropdown
                const options = [];

                // Add items
                if (shopData.items && shopData.items.length > 0) {
                    shopData.items.forEach(item => {
                        if (item.active) {
                            options.push({
                                label: item.name,
                                description: `${item.price} $GECKURA - ${item.description.substring(0, 50)}${item.description.length > 50 ? '...' : ''}`,
                                value: `item-${item.id}`
                            });
                        }
                    });
                }

                // Add roles
                if (shopData.roles && shopData.roles.length > 0) {
                    shopData.roles.forEach(role => {
                        if (role.active) {
                            options.push({
                                label: role.name,
                                description: `${role.price} $GECKURA - ${role.description.substring(0, 50)}${role.description.length > 50 ? '...' : ''}`,
                                value: `role-${role.id}`
                            });
                        }
                    });
                }

                // Create the select menu
                const select = new StringSelectMenuBuilder()
                    .setCustomId('shop-select')
                    .setPlaceholder('Select an item to purchase')
                    .addOptions(options);

                selectRow.addComponents(select);

                // Create an array of all rows
                const allRows = [row];
                if (options.length > 0) {
                    allRows.push(selectRow);
                }

                // Update the message to show the dropdown
                await i.update({
                    content: 'Please select an item from the dropdown menu below:',
                    embeds: [embed],
                    components: allRows
                });
            } else if (i.customId === 'shop-history') {
                // Get user purchase history
                const historyPath = path.join(__dirname, '..', 'data', 'purchase-history.json');
                let purchaseHistory = [];

                if (fs.existsSync(historyPath)) {
                    purchaseHistory = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
                }

                // Filter user's purchase history
                const userHistory = purchaseHistory.filter(p => p.userId === i.user.id);

                if (userHistory.length === 0) {
                    return await i.reply({ content: "You haven't made any purchases yet.", ephemeral: true });
                }

                // Create history embed
                const historyEmbed = new EmbedBuilder()
                    .setTitle('Your Purchase History')
                    .setColor('#0099FF')
                    .setDescription('Your recent purchases from the shop')
                    .setTimestamp()
                    .setFooter({ text: 'Geckura — Where Innovation Meets Utility!' });

                // Add purchases to embed (max 10)
                userHistory.slice(0, 10).forEach(purchase => {
                    const date = new Date(purchase.timestamp).toLocaleDateString();
                    historyEmbed.addFields({
                        name: `${purchase.itemName} - ${date}`,
                        value: `ID: ${purchase.itemId} | Price: ${purchase.price} $GECKURA`,
                        inline: false
                    });
                });

                await i.reply({ embeds: [historyEmbed], ephemeral: true });
            } else if (i.customId === 'shop-select') {
                const [type, id] = i.values[0].split('-');
                let item;

                if (type === 'item') {
                    item = shopData.items.find(item => item.id === id && item.active);
                } else if (type === 'role') {
                    item = shopData.roles.find(role => role.id === id && role.active);
                }

                if (!item) {
                    return await i.reply({ content: 'This item is no longer available.', ephemeral: true });
                }

                const userData = this.getUserData(i.user.id);

                if (userData.tokens < item.price) {
                    return await i.reply({ content: `You don't have enough $GECKURA tokens to purchase this item. You need **${item.price}** $GECKURA, but you only have **${userData.tokens}** $GECKURA.`, ephemeral: true });
                }

                // Create confirmation embed
                const confirmEmbed = new EmbedBuilder()
                    .setTitle('Confirm Purchase')
                    .setColor('#FFD700')
                    .setDescription(`Are you sure you want to purchase **${item.name}** for **${item.price}** $GECKURA?`)
                    .addFields(
                        { name: 'Item Description', value: item.description, inline: false },
                        { name: 'Your Balance', value: `${userData.tokens} $GECKURA`, inline: true },
                        { name: 'Remaining Balance', value: `${userData.tokens - item.price} $GECKURA`, inline: true }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Geckura — Where Innovation Meets Utility!' });

                // Create confirmation buttons
                const confirmRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`confirm-buy-${type}-${id}`)
                            .setLabel('Confirm Purchase')
                            .setStyle(ButtonStyle.Success)
                            .setEmoji('✅'),
                        new ButtonBuilder()
                            .setCustomId('cancel-purchase')
                            .setLabel('Cancel')
                            .setStyle(ButtonStyle.Danger)
                            .setEmoji('❌')
                    );

                await i.update({ embeds: [confirmEmbed], components: [confirmRow] });

                // Create a new collector for the confirmation
                const confirmFilter = ci => ci.user.id === i.user.id;
                const confirmCollector = i.channel.createMessageComponentCollector({ filter: confirmFilter, time: 30000 });

                confirmCollector.on('collect', async ci => {
                    if (ci.customId === `confirm-buy-${type}-${id}`) {
                        // Process the purchase
                        userData.tokens -= item.price;
                        this.saveUserData(i.user.id, userData);

                        // Save purchase history
                        this.savePurchaseHistory(i.user.id, item);

                        // Handle different item types
                        if (type === 'role') {
                            try {
                                const member = await i.guild.members.fetch(i.user.id);
                                await member.roles.add(item.roleId);

                                // Create success embed
                                const successEmbed = new EmbedBuilder()
                                    .setTitle('Purchase Successful!')
                                    .setColor('#00FF99')
                                    .setDescription(`You have successfully purchased the **${item.name}** role!`)
                                    .addFields(
                                        { name: 'Role ID', value: item.id, inline: true },
                                        { name: 'Price Paid', value: `${item.price} $GECKURA`, inline: true }
                                    )
                                    .setTimestamp()
                                    .setFooter({ text: 'Geckura — Where Innovation Meets Utility!' });

                                await ci.update({ embeds: [successEmbed], components: [] });
                            } catch (error) {
                                console.error('Error assigning role:', error);

                                // Refund tokens if role assignment fails
                                userData.tokens += item.price;
                                this.saveUserData(i.user.id, userData);

                                await ci.update({ content: 'There was an error assigning the role. Your tokens have been refunded.', embeds: [], components: [] });
                            }
                        } else {
                            // Create success embed
                            const successEmbed = new EmbedBuilder()
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

                            await ci.update({ embeds: [successEmbed], components: [] });

                            // Notify admins about the purchase
                            try {
                                const adminChannel = i.guild.channels.cache.find(c => c.name === 'admin' || c.name === 'staff');
                                if (adminChannel) {
                                    const adminEmbed = new EmbedBuilder()
                                        .setTitle('New Item Purchase!')
                                        .setColor('#FFD700')
                                        .setDescription(`**${i.user.username}** has purchased **${item.name}**`)
                                        .addFields(
                                            { name: 'User ID', value: i.user.id, inline: true },
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
                    } else if (ci.customId === 'cancel-purchase') {
                        await ci.update({ content: 'Purchase cancelled.', embeds: [], components: [] });
                    }
                });

                confirmCollector.on('end', collected => {
                    if (collected.size === 0) {
                        i.editReply({ content: 'Purchase confirmation timed out.', embeds: [], components: [] });
                    }
                });
            }
        });
    }
};
