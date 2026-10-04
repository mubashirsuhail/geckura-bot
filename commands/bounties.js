const bountyCommand = require('./bounty');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bounties')
        .setDescription('Display and manage the official Geckura Mint Bounty (30 Left Promos)')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Target channel to post the Mint Bounty embed to (optional)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('ping')
                .setDescription('Optional ping (e.g. everyone, or role name)')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('remaining')
                .setDescription('Update remaining supply of mint bounty NFTs (admin override)')
                .setRequired(false)),

    execute: bountyCommand.execute
};
