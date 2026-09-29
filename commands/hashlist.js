const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getHashlistConfig, saveHashlistConfig } = require('../utils/nft-verifier');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hashlist')
        .setDescription('Admin command to configure NFT collection addresses, hashlist mints, and holder roles')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub =>
            sub.setName('set-collection')
                .setDescription('Set the Metaplex Core / SPL Collection Address for automatic NFT verification')
                .addStringOption(option =>
                    option.setName('address')
                        .setDescription('Solana Collection Address (Public Key)')
                        .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('add-mints')
                .setDescription('Add mint addresses to the verification hashlist (comma separated)')
                .addStringOption(option =>
                    option.setName('mints')
                        .setDescription('Comma-separated list of Solana mint addresses')
                        .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('set-roles')
                .setDescription('Set Discord role names for holding tiers')
                .addRoleOption(option =>
                    option.setName('tier1_3')
                        .setDescription('Role for 1-3 NFTs (e.g. Geckura Holder)')
                        .setRequired(false))
                .addRoleOption(option =>
                    option.setName('tier4_9')
                        .setDescription('Role for 4-9 NFTs (e.g. Geckura Collector)')
                        .setRequired(false))
                .addRoleOption(option =>
                    option.setName('tier10_30')
                        .setDescription('Role for 10-30+ NFTs (e.g. Geckura Whale)')
                        .setRequired(false))
                .addRoleOption(option =>
                    option.setName('one_of_one')
                        .setDescription('Role for 1-of-1 NFTs (e.g. Geckura 1-of-1 Holder)')
                        .setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('view')
                .setDescription('View current collection address, hashlist count, and role settings')),

    async execute(interaction, client, config) {
        // Permission check
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return await interaction.reply({
                content: '🚫 **Access Denied:** Only server administrators can manage hashlist settings.',
                ephemeral: true
            });
        }

        const subcommand = interaction.options.getSubcommand();
        const hashlistConfig = getHashlistConfig();
        const primaryColor = parseInt(config?.colors?.primary?.replace('#', '') || '00FF99', 16);

        if (subcommand === 'set-collection') {
            const newAddress = interaction.options.getString('address').trim();

            hashlistConfig.collectionAddresses = hashlistConfig.collectionAddresses || [];
            if (!hashlistConfig.collectionAddresses.includes(newAddress)) {
                hashlistConfig.collectionAddresses.push(newAddress);
            }
            saveHashlistConfig(hashlistConfig);

            const embed = new EmbedBuilder()
                .setTitle('✅ Collection Address Updated')
                .setColor(primaryColor)
                .setDescription(`The Solana Collection Address has been added for automated verification:\n\n📍 **\`${newAddress}\`**`)
                .setTimestamp();

            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        else if (subcommand === 'add-mints') {
            const rawMints = interaction.options.getString('mints');
            const newMints = rawMints.split(',').map(m => m.trim()).filter(m => m.length >= 32 && m.length <= 44);

            hashlistConfig.hashlist = hashlistConfig.hashlist || [];
            let addedCount = 0;

            newMints.forEach(m => {
                if (!hashlistConfig.hashlist.includes(m)) {
                    hashlistConfig.hashlist.push(m);
                    addedCount++;
                }
            });
            saveHashlistConfig(hashlistConfig);

            const embed = new EmbedBuilder()
                .setTitle('✅ Hashlist Mints Added')
                .setColor(primaryColor)
                .setDescription(`Added **${addedCount}** new NFT mint addresses to the verification hashlist.\nTotal Mints in Hashlist: **${hashlistConfig.hashlist.length}**`)
                .setTimestamp();

            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        else if (subcommand === 'set-roles') {
            const t1 = interaction.options.getRole('tier1_3');
            const t2 = interaction.options.getRole('tier4_9');
            const t3 = interaction.options.getRole('tier10_30');
            const o1 = interaction.options.getRole('one_of_one');

            hashlistConfig.roles = hashlistConfig.roles || {};
            if (t1) hashlistConfig.roles.tier1_3 = t1.name;
            if (t2) hashlistConfig.roles.tier4_9 = t2.name;
            if (t3) hashlistConfig.roles.tier10_30 = t3.name;
            if (o1) hashlistConfig.roles.oneOfOne = o1.name;

            saveHashlistConfig(hashlistConfig);

            const embed = new EmbedBuilder()
                .setTitle('✅ Holder Tier Roles Configured')
                .setColor(primaryColor)
                .addFields(
                    { name: '1 - 3 NFTs Tier', value: `\`${hashlistConfig.roles.tier1_3 || 'Not set'}\``, inline: true },
                    { name: '4 - 9 NFTs Tier', value: `\`${hashlistConfig.roles.tier4_9 || 'Not set'}\``, inline: true },
                    { name: '10 - 30+ NFTs Tier', value: `\`${hashlistConfig.roles.tier10_30 || 'Not set'}\``, inline: true },
                    { name: '1-of-1 NFT Tier', value: `\`${hashlistConfig.roles.oneOfOne || 'Not set'}\``, inline: true }
                )
                .setTimestamp();

            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        else if (subcommand === 'view') {
            const collections = hashlistConfig.collectionAddresses || [];
            const mintsCount = (hashlistConfig.hashlist || []).length;
            const roles = hashlistConfig.roles || {};

            const embed = new EmbedBuilder()
                .setTitle('⚙️ NFT Verification & Hashlist Config')
                .setColor(primaryColor)
                .addFields(
                    {
                        name: '📍 Verified Collection Addresses',
                        value: collections.length > 0 ? collections.map(c => `\`${c}\``).join('\n') : '*None set (Use `/hashlist set-collection`)*',
                        inline: false
                    },
                    {
                        name: '📜 Total Hashlist Mints',
                        value: `**${mintsCount} mints**`,
                        inline: true
                    },
                    {
                        name: '🎭 Configured Tier Roles',
                        value: `• **1-3 NFTs:** \`${roles.tier1_3 || 'Geckura Holder'}\`\n` +
                               `• **4-9 NFTs:** \`${roles.tier4_9 || 'Geckura Collector'}\`\n` +
                               `• **10-30+ NFTs:** \`${roles.tier10_30 || 'Geckura Whale'}\`\n` +
                               `• **1-of-1 NFTs:** \`${roles.oneOfOne || 'Geckura 1-of-1 Holder'}\``,
                        inline: false
                    }
                )
                .setTimestamp();

            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
