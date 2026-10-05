const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { Connection, PublicKey } = require('@solana/web3.js');

const { getUserData } = require('../utils/chat2earn-handler');

// Solana RPC Endpoint
const SOLANA_RPC = process.env.SOLANA_RPC || process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const connection = new Connection(SOLANA_RPC, 'confirmed');

// Path to wallets and hashlist file
const dataPath = path.join(__dirname, '..', 'data');
const walletsPath = path.join(dataPath, 'wallets.json');
const hashlistPath = path.join(dataPath, 'hashlist.json');

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

// Helper to resolve and format image URIs for Discord embed compatibility
async function formatImageUri(item) {
    if (!item) return '';
    const content = item.content || {};
    const links = content.links || {};
    const files = content.files || [];

    // 1. Check for Helius CDN URI (fastest and guaranteed direct image rendering in Discord)
    for (const f of files) {
        if (f.cdn_uri && typeof f.cdn_uri === 'string' && f.cdn_uri.length > 0) {
            return f.cdn_uri;
        }
    }

    // 2. Check direct links image (e.g., Irys / Arweave / TribeX gateway)
    if (links.image && typeof links.image === 'string' && links.image.trim().length > 0) {
        let img = links.image.trim();
        if (img.startsWith('ipfs://')) {
            const cidPath = img.replace(/^ipfs:\/\/(ipfs\/)?/, '');
            return `https://nftstorage.link/ipfs/${cidPath}`;
        }
        if (img.includes('ipfs.io/ipfs/')) {
            return img.replace('ipfs.io/ipfs/', 'nftstorage.link/ipfs/');
        }
        return img;
    }

    // 3. Check files URI array
    for (const f of files) {
        if (f.uri && typeof f.uri === 'string' && f.uri.trim().length > 0) {
            let img = f.uri.trim();
            if (img.startsWith('ipfs://')) {
                const cidPath = img.replace(/^ipfs:\/\/(ipfs\/)?/, '');
                return `https://nftstorage.link/ipfs/${cidPath}`;
            }
            if (img.includes('ipfs.io/ipfs/')) {
                return img.replace('ipfs.io/ipfs/', 'nftstorage.link/ipfs/');
            }
            if (img.startsWith('http://') || img.startsWith('https://')) {
                return img;
            }
        }
    }

    // 4. Fallback: Fetch metadata JSON if image is not direct
    if (content.json_uri && typeof content.json_uri === 'string') {
        try {
            let fetchUrl = content.json_uri.trim();
            if (fetchUrl.startsWith('ipfs://')) {
                fetchUrl = `https://nftstorage.link/ipfs/${fetchUrl.replace(/^ipfs:\/\/(ipfs\/)?/, '')}`;
            }
            if (fetchUrl.startsWith('http')) {
                const res = await fetch(fetchUrl, { timeout: 3500 });
                if (res.ok) {
                    const data = await res.json();
                    let metaImg = data.image || data.properties?.files?.[0]?.uri || (typeof data.properties?.files?.[0] === 'string' ? data.properties.files[0] : '');
                    if (typeof metaImg === 'string' && metaImg.startsWith('ipfs://')) {
                        metaImg = `https://nftstorage.link/ipfs/${metaImg.replace(/^ipfs:\/\/(ipfs\/)?/, '')}`;
                    }
                    if (typeof metaImg === 'string' && metaImg.length > 0) return metaImg;
                }
            }
        } catch (e) {
            // Ignore fetch error
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
                    limit: 100
                }
            }),
            timeout: 8000
        });

        if (dasRes.ok) {
            const dasData = await dasRes.json();
            const items = dasData.result?.items || [];
            for (const item of items) {
                const name = item.content?.metadata?.name || item.id?.slice(0, 8) || 'Solana NFT';
                const image = await formatImageUri(item);
                const collection = item.grouping?.find(g => g.group_key === 'collection')?.group_value || '';
                
                nfts.push({
                    mint: item.id,
                    name: name,
                    symbol: item.content?.metadata?.symbol || '',
                    image: image,
                    collection: collection,
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
                            img = `https://nftstorage.link/ipfs/${img.replace(/^ipfs:\/\/(ipfs\/)?/, '')}`;
                        }
                        nfts.push({
                            mint: item.mintAddress || item.mint,
                            name: item.name || 'Unnamed Solana NFT',
                            symbol: item.symbol || '',
                            image: img,
                            collection: item.collectionName || item.collection || '',
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

// Build Clean Embed with LARGE Main NFT Image
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

    // Set NFT image as the LARGE main image below description & fields
    if (nft.image && typeof nft.image === 'string' && nft.image.trim().length > 0) {
        embed.setImage(nft.image.trim());
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
        .setDescription('Flex your owned Geckura NFTs from your connected Solana wallet!')
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

        // Load Hashlist for Geckura PFP verification
        let hashlistSet = new Set();
        try {
            if (fs.existsSync(hashlistPath)) {
                const hashlistData = JSON.parse(fs.readFileSync(hashlistPath, 'utf8'));
                hashlistSet = new Set(hashlistData.hashlist || []);
            }
        } catch (e) {}

        const GECKURA_PFP_COLLECTION = '4CVKjsUmP6RaRGkSjWXUV5updjUu9XKn6wPtd5BimHD7';

        // Filter: Exclude Elixir NFTs & keep only Geckura PFP collection
        const pfpNfts = (nfts || []).filter(nft => {
            const nameStr = (nft.name || '').toLowerCase();
            const symbolStr = (nft.symbol || '').toLowerCase();
            const collectionStr = (nft.collection || '').toLowerCase();

            // Explicitly exclude Elixir
            if (nameStr.includes('elixir') || symbolStr.includes('elixir') || collectionStr.includes('elixir')) {
                return false;
            }

            // Verify Geckura PFP Collection match (by mint in hashlist, collection address, or name)
            const isHashlistMatch = nft.mint && hashlistSet.has(nft.mint);
            const isCollectionMatch = collectionStr.includes(GECKURA_PFP_COLLECTION.toLowerCase()) || collectionStr.includes('geckura');
            const isNameMatch = nameStr.includes('geckura') || symbolStr.includes('geckura') || symbolStr === 'geck';

            return isHashlistMatch || isCollectionMatch || isNameMatch;
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

        // Send clean reply embed
        return await interaction.editReply({
            embeds: [initialEmbed]
        });
    }
};
