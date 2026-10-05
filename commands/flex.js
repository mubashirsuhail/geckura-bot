const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { Connection, PublicKey } = require('@solana/web3.js');

const { getUserData } = require('../utils/chat2earn-handler');

// Solana RPC Endpoint
const SOLANA_RPC = process.env.SOLANA_RPC || process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
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

// Helper to resolve and format image URIs (handling IPFS & metadata JSON resolution)
async function formatImageUri(rawUri, jsonUri) {
    let uri = rawUri || '';
    if (typeof uri === 'string' && uri.startsWith('ipfs://')) {
        return uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    if (typeof uri === 'string' && (uri.startsWith('http://') || uri.startsWith('https://'))) {
        return uri;
    }

    // Fallback: If no direct image URL but we have a json_uri, fetch metadata JSON
    if (jsonUri) {
        try {
            let fetchUrl = jsonUri;
            if (fetchUrl.startsWith('ipfs://')) {
                fetchUrl = fetchUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
            }
            if (fetchUrl.startsWith('http')) {
                const res = await fetch(fetchUrl, { timeout: 3000 });
                if (res.ok) {
                    const data = await res.json();
                    let img = data.image || data.properties?.files?.[0]?.uri || (typeof data.properties?.files?.[0] === 'string' ? data.properties.files[0] : '');
                    if (typeof img === 'string' && img.startsWith('ipfs://')) {
                        img = img.replace('ipfs://', 'https://ipfs.io/ipfs/');
                    }
                    if (typeof img === 'string' && img.length > 0) return img;
                }
            }
        } catch (e) {
            // Ignore metadata fetch error
        }
    }
    return '';
}

// Fetch NFTs from wallet via Helius DAS API & Magic Eden API
async function fetchWalletNFTs(walletAddress) {
    let nfts = [];

    // 1. Try Helius DAS API first (Supports Metaplex Core & SPL Tokens natively)
    try {
        const rpcUrl = process.env.SOLANA_RPC || process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
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
                const rawImg = item.content?.files?.[0]?.uri || item.content?.links?.image || '';
                const jsonUri = item.content?.json_uri || '';
                const image = await formatImageUri(rawImg, jsonUri);
                
                nfts.push({
                    mint: item.id,
                    name: name,
                    symbol: item.content?.metadata?.symbol || '',
                    image: image,
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
                        let img = item.image || item.mediaUrl || '';
                        if (typeof img === 'string' && img.startsWith('ipfs://')) {
                            img = img.replace('ipfs://', 'https://ipfs.io/ipfs/');
                        }
                        nfts.push({
                            mint: item.mintAddress || item.mint,
                            name: item.name || 'Unnamed Solana NFT',
                            symbol: item.symbol || '',
                            image: img,
                            externalUrl: item.externalUrl || `https://magiceden.io/item-details/${item.mintAddress || item.mint}`
                        });
                    }
                }
            }
        } catch (err) {
            console.warn('Magic Eden API lookup error:', err.message);
        }
    }

    return nfts;
}

// Build Clean Embed for a specific NFT
function buildFlexEmbed(user, walletAddress, nft) {
    const embed = new EmbedBuilder()
        .setTitle(`🦎 ${user.username}'s NFT Flex`)
        .setDescription(`**${nft.name}**`)
        .setColor('#00FF99')
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setFooter({ 
            text: 'Geckura — Turning Chaos into Flow', 
            iconURL: user.displayAvatarURL() 
        })
        .setTimestamp();

    // Set NFT image if available
    if (nft.image) {
        embed.setImage(nft.image);
    }

    // Clean field: NFT Name
    embed.addFields(
        { name: '🏷️ NFT Name', value: `\`${nft.name}\``, inline: true }
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

        // Filter: Exclude Elixir NFTs & keep only Geckura PFP collection
        const pfpNfts = (nfts || []).filter(nft => {
            const nameStr = (nft.name || '').toLowerCase();
            const symbolStr = (nft.symbol || '').toLowerCase();
            const collectionStr = (nft.collection || '').toLowerCase();

            // Explicitly exclude Elixir
            if (nameStr.includes('elixir') || symbolStr.includes('elixir') || collectionStr.includes('elixir')) {
                return false;
            }

            // Only allow Geckura PFP collection NFTs
            return nameStr.includes('geckura') || symbolStr.includes('geckura') || collectionStr.includes('geckura') || symbolStr === 'geck';
        });

        if (pfpNfts.length === 0) {
            const emptyEmbed = new EmbedBuilder()
                .setTitle('🔍 No Geckura PFP NFTs Found')
                .setDescription(`No Geckura PFP NFTs were found in wallet \`${walletAddress.slice(0, 6)}...${walletAddress.slice(-6)}\`.\n\n*(Note: Elixir collection NFTs are excluded from flex).*`)
                .setColor('#FF5555')
                .setFooter({ text: 'Geckura — Turning Chaos into Flow' });

            return await interaction.editReply({ embeds: [emptyEmbed] });
        }

        const initialEmbed = buildFlexEmbed(targetUser, walletAddress, pfpNfts[0]);

        // Send clean reply embed without pagination buttons
        return await interaction.editReply({
            embeds: [initialEmbed]
        });
    }
};
