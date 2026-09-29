const fs = require('fs');
const path = require('path');

const HELIUS_RPC_URL = 'https://mainnet.helius-rpc.com/?api-key=6c3afcf7-9ad6-4f5b-91b9-4f37f0b434d7';
const COLLECTION_ADDRESS = '4CVKjsUmP6RaRGkSjWXUV5updjUu9XKn6wPtd5BimHD7';

async function fetchCollectionHashlist() {
    console.log(`🚀 Querying Helius DAS API for Collection: ${COLLECTION_ADDRESS}...`);

    let page = 1;
    let allMints = [];
    let hasMore = true;

    while (hasMore) {
        console.log(`--> Fetching Page ${page}...`);
        const response = await fetch(HELIUS_RPC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: `helius-fetch-${page}`,
                method: 'getAssetsByGroup',
                params: {
                    groupKey: 'collection',
                    groupValue: COLLECTION_ADDRESS,
                    page: page,
                    limit: 1000
                }
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error('Helius API Error:', data.error);
            break;
        }

        if (data.result && data.result.items) {
            const items = data.result.items;
            console.log(`    Retrieved ${items.length} items on page ${page}.`);

            items.forEach(asset => {
                if (asset.id) {
                    allMints.push(asset.id);
                }
            });

            if (items.length < 1000) {
                hasMore = false;
            } else {
                page++;
            }
        } else {
            hasMore = false;
        }
    }

    console.log(`\n🎉 Total Collection Mints Found: ${allMints.length}`);

    // Update data/hashlist.json
    const hashlistPath = path.join(__dirname, '..', 'data', 'hashlist.json');
    let hashlistConfig = JSON.parse(fs.readFileSync(hashlistPath, 'utf8'));

    hashlistConfig.collectionAddresses = hashlistConfig.collectionAddresses || [];
    if (!hashlistConfig.collectionAddresses.includes(COLLECTION_ADDRESS)) {
        hashlistConfig.collectionAddresses.push(COLLECTION_ADDRESS);
    }

    hashlistConfig.hashlist = Array.from(new Set([...(hashlistConfig.hashlist || []), ...allMints]));

    fs.writeFileSync(hashlistPath, JSON.stringify(hashlistConfig, null, 2));
    console.log(`✅ Successfully saved ${hashlistConfig.hashlist.length} mints into data/hashlist.json!`);
}

fetchCollectionHashlist().catch(err => console.error(err));
