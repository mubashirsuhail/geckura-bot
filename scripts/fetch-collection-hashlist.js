const { Connection, PublicKey } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');

const COLLECTION_ADDRESS = '4CVKjsUmP6RaRGkSjWXUV5updjUu9XKn6wPtd5BimHD7';
const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
const METAPLEX_CORE_PROGRAM_ID = new PublicKey('CoRe111111111111111111111111111111111111111');

const RPC_ENDPOINTS = [
    'https://api.mainnet-beta.solana.com',
    'https://solana-rpc.publicnode.com',
    'https://rpc.ankr.com/solana'
];

async function fetchHashlist() {
    console.log(`🔍 Querying Solana mainnet for collection mints: ${COLLECTION_ADDRESS}...`);
    
    let connection = new Connection(RPC_ENDPOINTS[0], 'confirmed');
    const mintsSet = new Set();

    // 1. Try fetching Metaplex Core assets for collection address
    try {
        console.log("--> Fetching Metaplex Core accounts...");
        const accounts = await connection.getProgramAccounts(METAPLEX_CORE_PROGRAM_ID, {
            filters: [
                {
                    memcmp: {
                        offset: 33, // Update authority / Collection offset in Core Asset account
                        bytes: COLLECTION_ADDRESS
                    }
                }
            ]
        });

        accounts.forEach(acc => {
            mintsSet.add(acc.pubkey.toBase58());
        });
        console.log(`   Found ${accounts.length} Metaplex Core asset accounts.`);
    } catch (e) {
        console.log(`   Metaplex Core gPA note: ${e.message}`);
    }

    // 2. Try fetching Metaplex Token Metadata accounts with collection filter
    try {
        console.log("--> Fetching Metaplex Legacy Token Metadata accounts...");
        const accounts = await connection.getProgramAccounts(TOKEN_METADATA_PROGRAM_ID, {
            filters: [
                {
                    memcmp: {
                        offset: 368, // Collection key offset in Metadata Account (verified)
                        bytes: COLLECTION_ADDRESS
                    }
                }
            ]
        });

        accounts.forEach(acc => {
            // Read mint from metadata account bytes 33..65
            const mintPubKey = new PublicKey(acc.account.data.subarray(33, 65));
            mintsSet.add(mintPubKey.toBase58());
        });
        console.log(`   Found ${accounts.length} Legacy Metadata accounts.`);
    } catch (e) {
        console.log(`   Legacy Token Metadata gPA note: ${e.message}`);
    }

    const mints = Array.from(mintsSet);
    console.log(`\n🎉 Total unique collection mints fetched: ${mints.length}`);

    // Update data/hashlist.json
    const hashlistPath = path.join(__dirname, '..', 'data', 'hashlist.json');
    let hashlistConfig = {};
    if (fs.existsSync(hashlistPath)) {
        hashlistConfig = JSON.parse(fs.readFileSync(hashlistPath, 'utf8'));
    }

    hashlistConfig.collectionAddresses = hashlistConfig.collectionAddresses || [];
    if (!hashlistConfig.collectionAddresses.includes(COLLECTION_ADDRESS)) {
        hashlistConfig.collectionAddresses.push(COLLECTION_ADDRESS);
    }

    if (mints.length > 0) {
        hashlistConfig.hashlist = Array.from(new Set([...(hashlistConfig.hashlist || []), ...mints]));
        fs.writeFileSync(hashlistPath, JSON.stringify(hashlistConfig, null, 2));
        console.log(`✅ Saved ${mints.length} mints to data/hashlist.json!`);
    } else {
        console.log(`ℹ️ Collection address ${COLLECTION_ADDRESS} saved to data/hashlist.json (On-chain/DAS verification active).`);
        fs.writeFileSync(hashlistPath, JSON.stringify(hashlistConfig, null, 2));
    }
}

fetchHashlist().catch(err => console.error("Fetch error:", err));
