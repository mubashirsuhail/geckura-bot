const { Connection, PublicKey } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');

const MPL_CORE_PROGRAM_ID = new PublicKey('CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d');
const COLLECTION_ADDRESS = '4CVKjsUmP6RaRGkSjWXUV5updjUu9XKn6wPtd5BimHD7';

const RPC_URLS = [
    'https://solana-rpc.publicnode.com',
    'https://rpc.ankr.com/solana',
    'https://api.mainnet-beta.solana.com'
];

async function fetchMPLCoreMints() {
    console.log(`⚡ Scanning Metaplex Core assets for Collection: ${COLLECTION_ADDRESS}...`);

    let accounts = [];
    for (const url of RPC_URLS) {
        try {
            console.log(`Connecting to ${url}...`);
            const connection = new Connection(url, 'confirmed');

            // Scan for Metaplex Core assets containing the collection pubkey
            accounts = await connection.getProgramAccounts(MPL_CORE_PROGRAM_ID, {
                filters: [
                    {
                        memcmp: {
                            offset: 33, // MPL Core Collection Key location
                            bytes: COLLECTION_ADDRESS
                        }
                    }
                ]
            });

            if (accounts.length > 0) {
                console.log(`✅ Success! Found ${accounts.length} Metaplex Core asset mints on ${url}!`);
                break;
            }
        } catch (e) {
            console.log(`Failed on ${url}: ${e.message}`);
        }
    }

    // If offset 33 yielded 0, try offset 1 (Asset header / update authority)
    if (accounts.length === 0) {
        for (const url of RPC_URLS) {
            try {
                const connection = new Connection(url, 'confirmed');
                accounts = await connection.getProgramAccounts(MPL_CORE_PROGRAM_ID, {
                    filters: [
                        {
                            memcmp: {
                                offset: 1, // Update authority / collection owner
                                bytes: COLLECTION_ADDRESS
                            }
                        }
                    ]
                });
                if (accounts.length > 0) {
                    console.log(`✅ Found ${accounts.length} Metaplex Core asset mints via Update Authority offset!`);
                    break;
                }
            } catch (e) {
                // quiet retry
            }
        }
    }

    const mints = accounts.map(a => a.pubkey.toBase58());

    console.log(`\n🎉 Total Verified Metaplex Core Mints: ${mints.length}`);

    if (mints.length > 0) {
        const hashlistPath = path.join(__dirname, '..', 'data', 'hashlist.json');
        let hashlistConfig = JSON.parse(fs.readFileSync(hashlistPath, 'utf8'));

        hashlistConfig.hashlist = Array.from(new Set([...(hashlistConfig.hashlist || []), ...mints]));
        fs.writeFileSync(hashlistPath, JSON.stringify(hashlistConfig, null, 2));
        console.log(`💾 Successfully updated data/hashlist.json with ${mints.length} mint addresses!`);
    } else {
        console.log("⚠️ Direct gPA scan returned 0 items due to public RPC node filter restrictions.");
    }
}

fetchMPLCoreMints().catch(err => console.error(err));
