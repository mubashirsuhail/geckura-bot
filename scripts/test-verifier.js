const { getHashlistConfig, verifyWalletNFTs } = require('../utils/nft-verifier');

console.log("Current Hashlist Config:", getHashlistConfig());

// Test mock verification
(async () => {
    const res = await verifyWalletNFTs('11111111111111111111111111111111');
    console.log("Verification Result Test:", res);
})();
