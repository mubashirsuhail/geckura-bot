const fs = require('fs');
const path = require('path');
const { Connection, PublicKey } = require('@solana/web3.js');

const hashlistPath = path.join(__dirname, '..', 'data', 'hashlist.json');

// Helper to load hashlist config
function getHashlistConfig() {
    try {
        if (fs.existsSync(hashlistPath)) {
            return JSON.parse(fs.readFileSync(hashlistPath, 'utf8'));
        }
    } catch (e) {
        console.error('Error loading hashlist.json:', e);
    }
    return {
        collectionAddresses: [],
        hashlist: [],
        oneOfOneHashlist: [],
        roles: {
            tier1_3: "Geckura Holder",
            tier4_9: "Geckura Collector",
            tier10_30: "Geckura Whale",
            oneOfOne: "Geckura 1-of-1 Holder"
        }
    };
}

// Save hashlist config
function saveHashlistConfig(configData) {
    try {
        fs.writeFileSync(hashlistPath, JSON.stringify(configData, null, 2));
    } catch (e) {
        console.error('Error saving hashlist.json:', e);
    }
}

/**
 * Verify NFT holdings for a Solana wallet address
 * @param {string} walletAddress 
 */
async function verifyWalletNFTs(walletAddress) {
    const config = getHashlistConfig();
    const hashlistSet = new Set(config.hashlist || []);
    const oneOfOneSet = new Set(config.oneOfOneHashlist || []);
    const collectionSet = new Set(config.collectionAddresses || []);

    const result = {
        isHolder: false,
        is1of1Holder: false,
        holderCount: 0,
        oneOfOneCount: 0,
        matchedMints: [],
        assignedTier: null // 'tier1_3', 'tier4_9', or 'tier10_30'
    };

    const heliusApiKey = process.env.HELIUS_API_KEY;
    const rpcUrl = process.env.SOLANA_RPC_URL || (heliusApiKey ? `https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}` : 'https://api.mainnet-beta.solana.com');

    try {
        // Method 1: Helius DAS API (getAssetsByOwner)
        if (heliusApiKey) {
            const response = await fetch(rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 'geckura-verify',
                    method: 'getAssetsByOwner',
                    params: {
                        ownerAddress: walletAddress,
                        page: 1,
                        limit: 1000
                    }
                })
            });

            const data = await response.json();
            if (data.result && data.result.items) {
                data.result.items.forEach(asset => {
                    const mint = asset.id;
                    const grouping = asset.grouping || [];
                    const collectionGroup = grouping.find(g => g.group_key === 'collection');
                    const collectionAddress = collectionGroup ? collectionGroup.group_value : null;

                    const isMatch = hashlistSet.has(mint) || (collectionAddress && collectionSet.has(collectionAddress));
                    const is1of1 = oneOfOneSet.has(mint);

                    if (isMatch) {
                        result.matchedMints.push(mint);
                        result.isHolder = true;
                        result.holderCount++;
                    }
                    if (is1of1) {
                        result.is1of1Holder = true;
                        result.oneOfOneCount++;
                    }
                });
            }
        } else {
            // Method 2: On-chain Token Account parsing via RPC Connection
            const connection = new Connection(rpcUrl, 'confirmed');
            const ownerPubKey = new PublicKey(walletAddress);

            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(ownerPubKey, {
                programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
            });

            tokenAccounts.value.forEach(ta => {
                const amount = ta.account.data.parsed.info.tokenAmount.uiAmount;
                const mint = ta.account.data.parsed.info.mint;

                if (amount === 1) { // NFT amount check
                    if (hashlistSet.has(mint)) {
                        result.isHolder = true;
                        result.holderCount++;
                        result.matchedMints.push(mint);
                    }
                    if (oneOfOneSet.has(mint)) {
                        result.is1of1Holder = true;
                        result.oneOfOneCount++;
                    }
                }
            });

            // Method 2.b: Query Metaplex Core NFTs owned by wallet Address for instant Collection verification
            try {
                const mplCoreAccounts = await connection.getProgramAccounts(
                    new PublicKey('CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d'),
                    {
                        filters: [
                            {
                                memcmp: {
                                    offset: 1, // Owner Pubkey offset in Metaplex Core Asset
                                    bytes: walletAddress
                                }
                            }
                        ]
                    }
                );

                mplCoreAccounts.forEach(acc => {
                    const mint = acc.pubkey.toBase58();
                    const dataHex = acc.account.data.toString('hex');

                    // Check if collection address is present in asset buffer
                    let matchedCol = false;
                    collectionSet.forEach(colAddr => {
                        try {
                            const colHex = Buffer.from(new PublicKey(colAddr).toBuffer()).toString('hex');
                            if (dataHex.includes(colHex)) {
                                matchedCol = true;
                            }
                        } catch (e) {}
                    });

                    const isMatch = matchedCol || hashlistSet.has(mint);
                    const is1of1 = oneOfOneSet.has(mint);

                    if (isMatch) {
                        result.isHolder = true;
                        result.holderCount++;
                        if (!result.matchedMints.includes(mint)) result.matchedMints.push(mint);
                    }
                    if (is1of1) {
                        result.is1of1Holder = true;
                        result.oneOfOneCount++;
                    }
                });
            } catch (mplErr) {
                // If public gPA has filter limits, fallback gracefully
            }
        }

        // Determine Quantity Tier
        const count = result.holderCount;
        if (count >= 10) {
            result.assignedTier = 'tier10_30';
        } else if (count >= 4) {
            result.assignedTier = 'tier4_9';
        } else if (count >= 1) {
            result.assignedTier = 'tier1_3';
        }

    } catch (err) {
        console.error('Error during NFT verification:', err.message);
    }

    return result;
}

/**
 * Assign Discord Roles based on NFT holding tier
 * Tier 1-3: Geckura Holder
 * Tier 4-9: Geckura Collector
 * Tier 10-30+: Geckura Whale
 */
async function assignHolderRoles(guildMember, verificationResult) {
    if (!guildMember || !guildMember.roles) return { assigned: [], removed: [] };

    const config = getHashlistConfig();
    const roleNames = config.roles || {
        tier1_3: "Geckura Holder",
        tier4_9: "Geckura Collector",
        tier10_30: "Geckura Whale",
        oneOfOne: "Geckura 1-of-1 Holder"
    };

    const assigned = [];
    const removed = [];
    const guild = guildMember.guild;

    const findRole = (nameOrId) => guild.roles.cache.find(r => r.name === nameOrId || r.id === nameOrId);

    const tier1Role = findRole(roleNames.tier1_3);
    const tier2Role = findRole(roleNames.tier4_9);
    const tier3Role = findRole(roleNames.tier10_30);
    const oneOfOneRole = findRole(roleNames.oneOfOne);

    const tierRoles = [tier1Role, tier2Role, tier3Role].filter(Boolean);

    // Determine target role for quantity tier
    let targetRole = null;
    if (verificationResult.assignedTier === 'tier10_30') targetRole = tier3Role;
    else if (verificationResult.assignedTier === 'tier4_9') targetRole = tier2Role;
    else if (verificationResult.assignedTier === 'tier1_3') targetRole = tier1Role;

    // Apply / Remove Tiered Quantity Roles
    for (const role of tierRoles) {
        if (targetRole && role.id === targetRole.id) {
            if (!guildMember.roles.cache.has(role.id)) {
                await guildMember.roles.add(role).catch(() => {});
                assigned.push(role.name);
            }
        } else {
            if (guildMember.roles.cache.has(role.id)) {
                await guildMember.roles.remove(role).catch(() => {});
                removed.push(role.name);
            }
        }
    }

    // Apply 1-of-1 Role if applicable
    if (oneOfOneRole) {
        if (verificationResult.is1of1Holder) {
            if (!guildMember.roles.cache.has(oneOfOneRole.id)) {
                await guildMember.roles.add(oneOfOneRole).catch(() => {});
                assigned.push(oneOfOneRole.name);
            }
        }
    }

    return { assigned, removed, targetRoleName: targetRole ? targetRole.name : null };
}

module.exports = {
    getHashlistConfig,
    saveHashlistConfig,
    verifyWalletNFTs,
    assignHolderRoles
};
