const { verifyWalletNFTs, assignHolderRoles, getHashlistConfig } = require('../utils/nft-verifier');

console.log("==============================================");
console.log("🧪 TESTING /WALLET ROLE ASSIGNMENT FLOW...");
console.log("==============================================\n");

// Load hashlist config
const config = getHashlistConfig();
console.log(`📍 Collection Address: ${config.collectionAddresses[0]}`);
console.log(`📜 Loaded Mints in Hashlist: ${config.hashlist.length}`);
console.log(`🎭 Target Discord Role ID: ${config.roles.tier1_3}\n`);

// Mock Discord Guild & Member
const assignedRoles = [];
const mockMember = {
    user: { username: 'TestGeckuraHolder' },
    guild: {
        roles: {
            cache: [
                { id: '1451245425116840133', name: 'Verified Geckura Holder' }
            ],
            find(fn) {
                return this.cache.find(fn);
            }
        }
    },
    roles: {
        cache: new Set(),
        add: async (role) => {
            assignedRoles.push(role);
            console.log(`🎉 SUCCESS: Added Discord Role "${role.name}" (ID: ${role.id}) to user!`);
        },
        remove: async (role) => {}
    }
};

(async () => {
    // Pick a real mint from the 465 mints in hashlist.json
    const sampleMint = config.hashlist[0];
    console.log(`--> Simulating verification for a wallet holding mint: ${sampleMint}...`);

    // Simulated verification result (as returned when wallet holds 1+ NFTs)
    const verificationResult = {
        isHolder: true,
        is1of1Holder: false,
        holderCount: 1,
        oneOfOneCount: 0,
        matchedMints: [sampleMint],
        assignedTier: 'tier1_3'
    };

    console.log("\n--> Executing assignHolderRoles()...");
    const roleResult = await assignHolderRoles(mockMember, verificationResult);

    console.log("\n==============================================");
    console.log("RESULTS:");
    console.log(`• Assigned Roles: ${roleResult.assigned.join(', ')}`);
    console.log(`• Target Role Name: ${roleResult.targetRoleName}`);
    console.log("==============================================");
})();
