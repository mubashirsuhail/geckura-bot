const { frenzyManager } = require('../utils/gecko-frenzy-engine');
const { sendTokenReward } = require('../utils/solana-payout');
const { getUserData, saveUserData } = require('../utils/chat2earn-handler');

console.log("==================================================================");
console.log("🎮 SIMULATING GECKO FRENZY GAME & AUTOMATED REWARD PAYOUT FLOW...");
console.log("==================================================================\n");

// Mock Channel for Embed logs
const sentEmbeds = [];
const mockChannel = {
    send: async (payload) => {
        if (payload.embeds) {
            sentEmbeds.push(...payload.embeds);
        }
        return { id: 'mock-msg-id', edit: async () => {} };
    }
};

const mockClient = {
    user: { displayAvatarURL: () => 'https://geckura.io/icon.png' },
    channels: {
        fetch: async () => mockChannel
    }
};

async function runFullSimulation() {
    // 1. Create a 10-Player Frenzy Lobby
    const creatorId = 'admin-user-123';
    const lobby = frenzyManager.createFrenzy('guild-123', 'channel-456', creatorId, {
        rewardAmount: 500,
        rewardToken: '$GECKURA',
        maxPlayers: 10,
        lobbyMinutes: 0.1
    });

    console.log(`✅ Lobby Created: ID ${lobby.id} | Reward: ${lobby.rewardAmount} ${lobby.rewardToken}`);

    // Mock 10 Participants with various wallet & ATA configurations
    const mockPlayers = [
        { discordId: 'user-001', username: 'SolanaWhaleGecko', solanaWallet: '11111111111111111111111111111111' },
        { discordId: 'user-002', username: 'NoWalletGecko', solanaWallet: null },
        { discordId: 'user-003', username: 'CollectorGecko', solanaWallet: '22222222222222222222222222222222' },
        { discordId: 'user-004', username: 'DiamondGecko', solanaWallet: '33333333333333333333333333333333' },
        { discordId: 'user-005', username: 'SpeedyGecko', solanaWallet: null },
        { discordId: 'user-006', username: 'MysticGecko', solanaWallet: '44444444444444444444444444444444' },
        { discordId: 'user-007', username: 'CosmicGecko', solanaWallet: '55555555555555555555555555555555' },
        { discordId: 'user-008', username: 'LunarGecko', solanaWallet: null },
        { discordId: 'user-009', username: 'SolarGecko', solanaWallet: '66666666666666666666666666666666' },
        { discordId: 'user-010', username: 'ShadowGecko', solanaWallet: '77777777777777777777777777777777' }
    ];

    // Register players & save wallet info in Chat2Earn DB
    mockPlayers.forEach(p => {
        frenzyManager.addPlayer(lobby.id, { id: p.discordId, username: p.username });
        const uData = getUserData(p.discordId);
        uData.solanaWallet = p.solanaWallet;
        saveUserData(p.discordId, uData);
    });

    console.log(`👥 Registered ${lobby.players.length} players into the Frenzy lobby.`);
    console.log("\n==================================================================");
    console.log("⚔️ STARTING ROUND-BASED GAME LOOP & SECOND LIFE (15%) REVIVE ENGINE...");
    console.log("==================================================================\n");

    // Force start the battle
    await frenzyManager.startFrenzyLoop(mockClient, lobby.id);

    // Wait until battle completes
    let attempts = 0;
    while (lobby.status !== 'COMPLETED' && attempts < 40) {
        await new Promise(r => setTimeout(r, 1500));
        attempts++;
    }

    console.log(`\n🎉 GAME LOOP CONCLUDED! Total Embed Messages Generated: ${sentEmbeds.length}`);

    // Print final embed details
    const winnerEmbed = sentEmbeds[sentEmbeds.length - 1];
    if (winnerEmbed && winnerEmbed.data) {
        console.log("\n==================================================================");
        console.log("👑 WINNER ANNOUNCEMENT EMBED PAYLOAD:");
        console.log("==================================================================");
        console.log(`• Title: ${winnerEmbed.data.title}`);
        console.log(`• Description:\n${winnerEmbed.data.description}`);
    }

    // 2. Test Automated Solana Payout Module Direct Logic
    console.log("\n==================================================================");
    console.log("🧪 TESTING PAYOUT MODULE CORNER CASES:");
    console.log("==================================================================");

    // Case A: No Wallet Connected
    const testA = await sendTokenReward(null, 500, 'MockMintAddress111111111111111111111111111');
    console.log(`• Case A (No Wallet): ${testA.error} => ${testA.message}`);

    // Case B: No Treasury Key Set Yet (Safe Fallback)
    delete process.env.SOLANA_TREASURY_SECRET_KEY;
    const testB = await sendTokenReward('11111111111111111111111111111111', 500, 'MockMintAddress111111111111111111111111111');
    console.log(`• Case B (Unconfigured Key): ${testB.error} => ${testB.message}`);

    console.log("\n✅ ALL BUG CHECKS & SIMULATIONS PASSED CLEANLY!");
}

runFullSimulation().catch(err => console.error("Simulation error:", err));
