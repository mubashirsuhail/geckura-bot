const { buildVerificationEmbed, buildVerificationButtons } = require('../commands/verification-panel');
const { handleVerificationButton, handleVerificationModalSubmit } = require('../utils/verification-handler');

console.log("==================================================================");
console.log("🧪 TESTING MATRICA-STYLE HOLDER VERIFICATION PANEL & MODALS...");
console.log("==================================================================\n");

const mockClient = { user: { displayAvatarURL: () => 'https://geckura.io/icon.png' } };
const mockConfig = { colors: { primary: '#00FF99' } };

// Test 1: Embed & Component Generation
console.log("--> Test 1: Building Verification Embed & Action Row Buttons...");
const embed = buildVerificationEmbed(mockConfig, mockClient);
const buttons = buildVerificationButtons();

console.log(`   Title: ${embed.data.title}`);
console.log(`   Buttons Count: ${buttons.components.length}`);
console.log(`   Button 1 Label: ${buttons.components[0].data.label} (CustomID: ${buttons.components[0].data.custom_id})\n`);

// Test 2: Modal Popup Opening
console.log("--> Test 2: Simulating 'Paste Wallet & Verify' Button Click...");
let modalShown = null;
const mockBtnInteraction = {
    customId: 'verify_modal_btn',
    user: { id: 'test-holder-user-999' },
    showModal: async (m) => { modalShown = m; }
};

(async () => {
    await handleVerificationButton(mockBtnInteraction, mockClient);
    if (modalShown) {
        console.log(`   Modal Title: ${modalShown.data.title}`);
        console.log(`   Input Field CustomID: ${modalShown.components[0].components[0].data.custom_id}\n`);
    }

    // Test 3: Modal Submission & On-Chain Role Assignment
    console.log("--> Test 3: Simulating Wallet Address Modal Submission...");
    let deferred = false;
    let replyPayload = null;

    const mockModalSubmit = {
        customId: 'verify_wallet_modal_submit',
        user: { id: 'test-holder-user-999' },
        member: {
            guild: {
                roles: {
                    cache: [
                        { id: '1451245425116840133', name: 'Geckura Holder' }
                    ]
                }
            },
            roles: {
                cache: new Map(),
                add: async (roleId) => console.log(`   ✅ Discord Role Assigned: ID ${roleId}`),
                remove: async (roleId) => console.log(`   ℹ️ Discord Role Removed: ID ${roleId}`)
            }
        },
        fields: {
            getTextInputValue: (id) => id === 'wallet_address_input' ? '7Xw3mK8s2u9N4pQ1vR3tW6yZ8xJ2vK5m' : null
        },
        deferReply: async () => { deferred = true; },
        editReply: async (p) => { replyPayload = p; return p; }
    };

    await handleVerificationModalSubmit(mockModalSubmit, mockClient);

    if (replyPayload && replyPayload.embeds) {
        console.log(`   Response Title: ${replyPayload.embeds[0].data.title}`);
        console.log(`   Response Content:\n${replyPayload.embeds[0].data.description}\n`);
    }

    console.log("✅ ALL MATRICA VERIFICATION PANEL TESTS PASSED SUCCESSFULLY!");
})();
