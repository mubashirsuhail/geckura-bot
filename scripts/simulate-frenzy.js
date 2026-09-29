const { frenzyManager } = require('../utils/gecko-frenzy-engine');

console.log("=================================================");
console.log("🦎 STARTING GECKO FRENZY GAME ENGINE SIMULATION 🦎");
console.log("=================================================\n");

// 1. Mock Discord Channel & Client
const mockLogs = [];
const mockChannel = {
    id: 'mock_channel_123',
    send: async (data) => {
        let embed = data.embeds ? data.embeds[0] : null;
        if (embed) {
            console.log(`\n📢 [DISCORD EMBED] Title: "${embed.data.title}"`);
            if (embed.data.description) {
                console.log(`   Description:\n   ${embed.data.description.replace(/\n/g, '\n   ')}`);
            }
            if (embed.data.fields) {
                embed.data.fields.forEach(f => console.log(`   • ${f.name}: ${f.value}`));
            }
        }
        return { id: 'mock_msg_id' };
    },
    messages: {
        fetch: async () => ({
            edit: async (data) => {}
        })
    }
};

const mockClient = {
    channels: {
        fetch: async () => mockChannel
    }
};

// 2. Create Frenzy Lobby
console.log("--> Creating Frenzy Lobby (10 Players, 1,000 $GECKURA Reward)...");
const frenzy = frenzyManager.createFrenzy({
    guildId: 'mock_guild',
    channelId: 'mock_channel_123',
    creatorId: 'admin_user',
    joinTimeMinutes: 1,
    rewardToken: '$GECKURA',
    rewardAmount: 1000,
    maxPlayers: 10
});

// 3. Add 10 Simulated Players
const mockUsers = [
    { id: 'user_1', tag: 'CryptoGecko#0001' },
    { id: 'user_2', tag: 'SolanaKing#1234' },
    { id: 'user_3', tag: 'GigaChad#9999' },
    { id: 'user_4', tag: 'MemeLord#4200' },
    { id: 'user_5', tag: 'DiamondHands#7777' },
    { id: 'user_6', tag: 'AlphaHunter#1111' },
    { id: 'user_7', tag: 'MoonShooter#8888' },
    { id: 'user_8', tag: 'PixelGecko#5555' },
    { id: 'user_9', tag: 'AuraMaster#3333' },
    { id: 'user_10', tag: 'DeFiRunner#6666' }
];

console.log("--> Joining 10 Players to Lobby...");
mockUsers.forEach(u => {
    frenzyManager.addPlayer(frenzy.id, u, null);
});

console.log(`--> Total Players Joined: ${frenzy.players.length} / ${frenzy.maxPlayers}`);
console.log(`--> Max Second Life Revives Allocated: ${frenzy.maxRevives}`);

// 4. Start Frenzy Battle Loop
console.log("\n⚔️ STARTING FRENZY BATTLE LOOP...");
(async () => {
    // Override 6000ms delay to 100ms for fast test simulation
    const originalSetInterval = global.setInterval;
    global.setInterval = (fn, delay) => originalSetInterval(fn, 50);

    await frenzyManager.startFrenzyLoop(mockClient, frenzy.id);

    // Give simulation time to run
    setTimeout(() => {
        console.log("\n=================================================");
        console.log("✅ GECKO FRENZY SIMULATION COMPLETED SUCCESSFULLY!");
        console.log("=================================================");
        process.exit(0);
    }, 1500);
})();
