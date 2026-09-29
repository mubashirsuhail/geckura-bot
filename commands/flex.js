const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { Connection, PublicKey } = require('@solana/web3.js');

const { getUserData } = require('../utils/chat2earn-handler');

// Solana RPC Endpoint
const SOLANA_RPC = process.env.SOLANA_RPC_URL || process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
const connection = new Connection(SOLANA_RPC, 'confirmed');

// Path to wallets file
const dataPath = path.join(__dirname, '..', 'data');
const walletsPath = path.join(dataPath, 'wallets.json');

// Read wallets helper
function getUserWallet(discordId) {
    try {
        // 1. Primary check: Chat2Earn user profile (saved via /wallet set & Matrica verification modal)
        const userData = getUserData(discordId);
        if (userData && userData.solanaWallet) {
            return userData.solanaWallet;
        }

        // 2. Fallback check: wallets.json (legacy whitelist / airdrop)
        if (fs.existsSync(walletsPath)) {
            const wallets = JSON.parse(fs.readFileSync(walletsPath, 'utf8'));
            const wlEntry = (wallets.whitelist || []).find(w => w.discordId === discordId);
            if (wlEntry) return wlEntry.walletAddress;

            const airdropEntry = (wallets.airdrop || []).find(w => w.discordId === discordId);
            if (airdropEntry) return airdropEntry.walletAddress;
        }

        return null;
    } catch (err) {
        console.error('Error reading wallets for flex:', err);
        return null;
    }
}

// Fetch NFTs from wallet via Helius DAS API & Magic Eden API
async function fetchWalletNFTs(walletAddress) {
    let nfts = [];

    // 1. Try Helius DAS API first (Supports Metaplex Core & SPL Tokens natively)
    try {
        const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
        const dasRes = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'flex-das-fetch',
                method: 'getAssetsByOwner',
                params: {
                    ownerAddress: walletAddress,
                    page: 1,
                    limit: 50
                }
            }),
            timeout: 8000
        });

        if (dasRes.ok) {
            const dasData = await dasRes.json();
            const items = dasData.result?.items || [];
            for (const item of items) {
                const name = item.content?.metadata?.name || item.id?.slice(0, 8) || 'Solana NFT';
                const image = item.content?.files?.[0]?.uri || item.content?.links?.image || '';
                const collection = item.grouping?.find(g => g.group_key === 'collection')?.group_value || 'Geckura NFT';
                
                nfts.push({
                    mint: item.id,
                    name: name,
                    symbol: item.content?.metadata?.symbol || '',
                    image: image,
                    collection: collection,
                    attributes: item.content?.metadata?.attributes || [],
                    externalUrl: `https://solscan.io/token/${item.id}`
                });
            }
        }
    } catch (dasErr) {
        console.warn('Helius DAS API flex lookup notice:', dasErr.message);
    }

    // 2. Fallback to Magic Eden API if DAS yields no results
    if (nfts.length === 0) {
        try {
            const meRes = await fetch(`https://api-mainnet.magiceden.dev/v2/wallets/${walletAddress}/tokens?limit=50`, {
                headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
                timeout: 8000
            });

            if (meRes.ok) {
                const meTokens = await meRes.json();
                if (Array.isArray(meTokens) && meTokens.length > 0) {
                    for (const item of meTokens) {
                        nfts.push({
                            mint: item.mintAddress || item.mint,
                            name: item.name || 'Unnamed Solana NFT',
                            symbol: item.symbol || '',
                            image: item.image || item.mediaUrl || '',
                            collection: item.collectionName || item.collection || 'Solana NFT',
                            attributes: item.attributes || [],
                            externalUrl: item.externalUrl || `https://magiceden.io/item-details/${item.mintAddress || item.mint}`
                        });
                    }
                }
            }
        } catch (err) {
            console.warn('Magic Eden API lookup error:', err.message);
        }
    }

    // 2. Fallback to Solana RPC parsed token accounts if ME returns empty or fails
    if (nfts.length === 0) {
        try {
            const pubkey = new PublicKey(walletAddress);
            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
                programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
            });

            const nftCandidates = tokenAccounts.value.filter(account => {
                const amount = account.account.data.parsed.info.tokenAmount;
                return amount.amount === '1' && amount.decimals === 0;
            });

            for (const item of nftCandidates.slice(0, 10)) { // limit to 10 for performance
                const mint = item.account.data.parsed.info.mint;
                
                // Fetch metadata URI via Helius/Metaplex or Solscan
                try {
                    const solscanRes = await fetch(`https://public-api.solscan.io/token/meta?tokenAddress=${mint}`, {
                        headers: { 'User-Agent': 'Mozilla/5.0' },
                        timeout: 5000
                    });
                    if (solscanRes.ok) {
                        const meta = await solscanRes.json();
                        nfts.push({
                            mint: mint,
                            name: meta.name || `NFT #${mint.slice(0, 6)}`,
                            symbol: meta.symbol || '',
                            image: meta.icon || meta.image || '',
                            collection: meta.collectionName || 'Solana NFT',
                            attributes: meta.attributes || [],
                            externalUrl: `https://solscan.io/token/${mint}`
                        });
                    }
                } catch (e) {
                    nfts.push({
                        mint: mint,
                        name: `Solana NFT (${mint.slice(0, 6)}...)`,
                        image: '',
                        collection: 'Solana NFT',
                        externalUrl: `https://solscan.io/token/${mint}`
                    });
                }
            }
        } catch (rpcErr) {
            console.error('Solana RPC NFT lookup error:', rpcErr.message);
        }
    }

    return nfts;
}

// Build Embed for a specific NFT
function buildFlexEmbed(user, walletAddress, nft, index, totalNFTs) {
    let cleanCollection = nft.collection || 'Geckura Collection';
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(cleanCollection)) {
        cleanCollection = 'Geckura Collection';
    }

    const embed = new EmbedBuilder()
        .setTitle(`🦎 ${user.username}'s NFT Flex`)
        .setDescription(`**${nft.name}**`)
        .setColor('#00FF99')
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setFooter({ 
            text: `Geckura — Turning Chaos into Flow • NFT ${index + 1} of ${totalNFTs}`, 
            iconURL: user.displayAvatarURL() 
        })
        .setTimestamp();

    // Set NFT image if available
    if (nft.image) {
        embed.setImage(nft.image);
    }

    // Clean fields: NFT Name, Collection, and NFT Item Number
    embed.addFields(
        { name: '🏷️ NFT Name', value: `\`${nft.name}\``, inline: true },
        { name: '📦 Collection', value: `\`${cleanCollection}\``, inline: true },
        { name: '🔢 Item', value: `\`NFT ${index + 1} of ${totalNFTs}\``, inline: true }
    );

    if (nft.mint) {
        embed.addFields({
            name: '🔗 Marketplace & Explorer Links',
            value: `[Magic Eden](https://magiceden.io/item-details/${nft.mint}) • [Solscan](https://solscan.io/token/${nft.mint})`,
            inline: false
        });
    }

    return embed;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('flex')
        .setDescription('Flex your owned NFTs from your connected Solana wallet!')
        .addStringOption(option =>
            option
                .setName('wallet')
                .setDescription('Optional Solana wallet address to flex NFTs from')
                .setRequired(false)
        )
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Optional user to flex connected wallet NFTs for')
                .setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: false });

        const targetUser = interaction.options.getUser('user') || interaction.user;
        const customWallet = interaction.options.getString('wallet');

        // Resolve wallet address
        let walletAddress = customWallet;
        if (!walletAddress) {
            walletAddress = getUserWallet(targetUser.id);
        }

        if (!walletAddress) {
            const noWalletEmbed = new EmbedBuilder()
                .setTitle('⚠️ Wallet Not Connected')
                .setDescription(
                    targetUser.id === interaction.user.id
                        ? 'You haven\'t linked your Solana wallet yet!\n\nUse `/wallet set <address>` or use the **Holder Verification** panel to connect your wallet and flex your NFTs.'
                        : `**${targetUser.username}** has not connected their Solana wallet yet.`
                )
                .setColor('#FF9900')
                .setFooter({ text: 'Geckura — Turning Chaos into Flow' });

            return await interaction.editReply({ embeds: [noWalletEmbed] });
        }

        // Validate basic Solana base58 format
        if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddress)) {
            return await interaction.editReply({
                content: '⚠️ **Invalid Wallet Address:** Provided wallet address is not a valid Solana address.'
            });
        }

        // Fetch NFTs
        const nfts = await fetchWalletNFTs(walletAddress);

        if (!nfts || nfts.length === 0) {
            const emptyEmbed = new EmbedBuilder()
                .setTitle('🔍 No NFTs Found')
                .setDescription(`No NFTs were found in wallet \`${walletAddress.slice(0, 6)}...${walletAddress.slice(-6)}\`.\n\nMake sure your wallet holds Geckura or Solana NFTs, or try again shortly!`)
                .setColor('#FF5555')
                .setFooter({ text: 'Geckura — Turning Chaos into Flow' });

            return await interaction.editReply({ embeds: [emptyEmbed] });
        }

        let currentIndex = 0;
        const initialEmbed = buildFlexEmbed(targetUser, walletAddress, nfts[currentIndex], currentIndex, nfts.length);

        // Build navigation buttons if there are multiple NFTs
        const components = [];

        if (nfts.length > 1) {
            const prevBtn = new ButtonBuilder()
                .setCustomId('flex_prev')
                .setLabel('◀ Previous')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true);

            const counterBtn = new ButtonBuilder()
                .setCustomId('flex_counter')
                .setLabel(`1 / ${nfts.length}`)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true);

            const nextBtn = new ButtonBuilder()
                .setCustomId('flex_next')
                .setLabel('Next ▶')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(prevBtn, counterBtn, nextBtn);
            components.push(row);
        }

        const replyMessage = await interaction.editReply({
            embeds: [initialEmbed],
            components: components
        });

        if (nfts.length <= 1) return;

        // Collector for component pagination buttons
        const collector = replyMessage.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 120000 // 2 minutes active window
        });

        collector.on('collect', async buttonInteraction => {
            if (buttonInteraction.user.id !== interaction.user.id) {
                return await buttonInteraction.reply({
                    content: '⚠️ Only the command invoker can control NFT navigation.',
                    ephemeral: true
                });
            }

            if (buttonInteraction.customId === 'flex_prev') {
                if (currentIndex > 0) currentIndex--;
            } else if (buttonInteraction.customId === 'flex_next') {
                if (currentIndex < nfts.length - 1) currentIndex++;
            }

            const newEmbed = buildFlexEmbed(targetUser, walletAddress, nfts[currentIndex], currentIndex, nfts.length);

            const updatedRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('flex_prev')
                    .setLabel('◀ Previous')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentIndex === 0),
                new ButtonBuilder()
                    .setCustomId('flex_counter')
                    .setLabel(`${currentIndex + 1} / ${nfts.length}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('flex_next')
                    .setLabel('Next ▶')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentIndex === nfts.length - 1)
            );

            await buttonInteraction.update({
                embeds: [newEmbed],
                components: [updatedRow]
            });
        });

        collector.on('end', async () => {
            try {
                // Disable navigation buttons after timeout
                const disabledRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('flex_prev').setLabel('◀ Previous').setStyle(ButtonStyle.Primary).setDisabled(true),
                    new ButtonBuilder().setCustomId('flex_counter').setLabel(`${currentIndex + 1} / ${nfts.length}`).setStyle(ButtonStyle.Secondary).setDisabled(true),
                    new ButtonBuilder().setCustomId('flex_next').setLabel('Next ▶').setStyle(ButtonStyle.Primary).setDisabled(true)
                );
                await interaction.editReply({ components: [disabledRow] });
            } catch (err) {
                // Message might have been deleted
            }
        });
    }
};
