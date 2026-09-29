const withdrawCommand = require('../commands/withdraw');
const { getUserData, saveUserData } = require('../utils/chat2earn-handler');

console.log("=================================================");
console.log("🧪 TESTING /WITHDRAW COMMAND EXECUTION...");
console.log("=================================================\n");

const testUserId = 'test-withdraw-user-777';
const userData = getUserData(testUserId);
userData.tokens = 1500;
userData.solanaWallet = '11111111111111111111111111111111';
saveUserData(testUserId, userData);

// Mock interaction object
function createMockInteraction(amount, userWallet = '11111111111111111111111111111111', tokens = 1500) {
    const uData = getUserData(testUserId);
    uData.tokens = tokens;
    uData.solanaWallet = userWallet;
    saveUserData(testUserId, uData);

    let repliedPayload = null;
    let deferred = false;

    return {
        user: { id: testUserId, username: 'WithdrawTester' },
        options: {
            getInteger: (name) => name === 'amount' ? amount : null
        },
        reply: async (payload) => {
            repliedPayload = payload;
            return payload;
        },
        deferReply: async (opts) => {
            deferred = true;
        },
        editReply: async (payload) => {
            repliedPayload = payload;
            return payload;
        },
        getPayload: () => repliedPayload
    };
}

const mockClient = { user: { displayAvatarURL: () => 'https://geckura.io/icon.png' } };
const mockConfig = { colors: { primary: '#00FF99' } };

(async () => {
    // Test 1: Withdrawal below 500 threshold
    console.log("--> Scenario 1: Amount below 500 threshold (requested 250)...");
    const int1 = createMockInteraction(250);
    await withdrawCommand.execute(int1, mockClient, mockConfig);
    console.log(`   Reply: ${int1.getPayload().content}\n`);

    // Test 2: Unlinked wallet
    console.log("--> Scenario 2: Unlinked Solana Wallet...");
    const int2 = createMockInteraction(1000, null);
    await withdrawCommand.execute(int2, mockClient, mockConfig);
    console.log(`   Reply: ${int2.getPayload().content}\n`);

    // Test 3: Insufficient Token Balance
    console.log("--> Scenario 3: Insufficient Token Balance (requested 2000, balance 500)...");
    const int3 = createMockInteraction(2000, '11111111111111111111111111111111', 500);
    await withdrawCommand.execute(int3, mockClient, mockConfig);
    console.log(`   Reply: ${int3.getPayload().content}\n`);

    // Test 4: Valid Withdrawal Request
    console.log("--> Scenario 4: Valid Withdrawal Request (requested 600, balance 1500)...");
    const int4 = createMockInteraction(600, '11111111111111111111111111111111', 1500);
    await withdrawCommand.execute(int4, mockClient, mockConfig);
    const p4 = int4.getPayload();
    if (p4.embeds) {
        console.log(`   Embed Title: ${p4.embeds[0].data.title}`);
        console.log(`   Embed Content:\n${p4.embeds[0].data.description}\n`);
    }

    console.log("✅ ALL /WITHDRAW COMMAND TESTS EXECUTED SUCCESSFULLY!");
})();
