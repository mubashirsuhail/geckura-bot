const { Connection, PublicKey } = require('@solana/web3.js');

async function inspectAccount() {
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    const pubkey = new PublicKey('4CVKjsUmP6RaRGkSjWXUV5updjUu9XKn6wPtd5BimHD7');

    console.log("🔍 Inspecting Solana address: 4CVKjsUmP6RaRGkSjWXUV5updjUu9XKn6wPtd5BimHD7...");
    const info = await connection.getAccountInfo(pubkey);

    if (!info) {
        console.log("Account not found or uninitialized on Solana Mainnet-Beta.");
        return;
    }

    console.log(`Owner Program: ${info.owner.toBase58()}`);
    console.log(`Executable: ${info.executable}`);
    console.log(`Lamports Balance: ${info.lamports / 1e9} SOL`);
    console.log(`Data Length: ${info.data.length} bytes`);
}

inspectAccount().catch(err => console.error(err));
