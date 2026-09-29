const { Connection, PublicKey } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');

const COLLECTION_ADDRESS = '4CVKjsUmP6RaRGkSjWXUV5updjUu9XKn6wPtd5BimHD7';

async function fetchFromSignatures() {
    console.log(`🔍 Fetching transaction history for collection address: ${COLLECTION_ADDRESS}...`);

    const rpcUrls = [
        'https://api.mainnet-beta.solana.com',
        'https://solana-rpc.publicnode.com',
        'https://rpc.ankr.com/solana'
    ];

    let connection;
    for (const url of rpcUrls) {
        try {
            connection = new Connection(url, 'confirmed');
            const sigs = await connection.getSignaturesForAddress(new PublicKey(COLLECTION_ADDRESS), { limit: 1000 });
            console.log(`✅ Fetched ${sigs.length} transaction signatures from RPC (${url}).`);

            const foundMints = new Set();

            for (let i = 0; i < Math.min(sigs.length, 100); i++) {
                const tx = await connection.getParsedTransaction(sigs[i].signature, { maxSupportedTransactionVersion: 0 });
                if (tx && tx.transaction && tx.transaction.message) {
                    const accountKeys = tx.transaction.message.accountKeys.map(k => k.pubkey ? k.pubkey.toBase58() : k.toBase58());
                    accountKeys.forEach(key => {
                        if (key !== COLLECTION_ADDRESS && key.length >= 32 && key.length <= 44) {
                            // Collect candidate mint keys
                            foundMints.add(key);
                        }
                    });
                }
            }

            console.log(`Found ${foundMints.size} candidate addresses from transaction history.`);
            break;
        } catch (e) {
            console.log(`RPC ${url} error: ${e.message}`);
        }
    }
}

fetchFromSignatures().catch(err => console.error("Error:", err));
