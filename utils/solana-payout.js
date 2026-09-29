const { Connection, Keypair, PublicKey, SystemProgram, Transaction } = require('@solana/web3.js');
const { getOrCreateAssociatedTokenAccount, createTransferInstruction, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const bs58 = require('bs58');

// Helper to parse keypair from string (base58 or json array)
function getTreasuryKeypair() {
    const secretKeyStr = process.env.SOLANA_TREASURY_SECRET_KEY;
    if (!secretKeyStr) {
        throw new Error('SOLANA_TREASURY_SECRET_KEY is not configured in .env file.');
    }

    try {
        const trimmed = secretKeyStr.trim();
        if (trimmed.startsWith('[')) {
            const arr = JSON.parse(trimmed);
            return Keypair.fromSecretKey(Uint8Array.from(arr));
        } else {
            // Assume Base58 encoded secret key
            const decoded = bs58.decode(trimmed);
            return Keypair.fromSecretKey(decoded);
        }
    } catch (e) {
        throw new Error(`Failed to parse SOLANA_TREASURY_SECRET_KEY: ${e.message}`);
    }
}

// Get RPC Connection
function getSolanaConnection() {
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    return new Connection(rpcUrl, 'confirmed');
}

/**
 * Send SPL Token Reward (e.g. $GECKURA) to recipient wallet address
 * @param {string} recipientAddress - Solana wallet address of the winner
 * @param {number} amountTokens - Amount of tokens to transfer
 * @param {string} [tokenMintAddress] - SPL Token mint address
 */
async function sendTokenReward(recipientAddress, amountTokens, tokenMintAddress) {
    const mintStr = tokenMintAddress || process.env.GECKURA_TOKEN_MINT;

    if (!recipientAddress) {
        return { success: false, error: 'Recipient Solana wallet address is missing.' };
    }

    // If no custom token mint is set, fallback to SOL or return mock/offchain status if key unconfigured
    if (!process.env.SOLANA_TREASURY_SECRET_KEY) {
        return {
            success: false,
            simulated: true,
            error: 'SOLANA_TREASURY_SECRET_KEY not set in .env yet.'
        };
    }

    try {
        const connection = getSolanaConnection();
        const treasury = getTreasuryKeypair();
        const recipientPubKey = new PublicKey(recipientAddress);

        if (!mintStr) {
            // Transfer native SOL as fallback
            const lamports = Math.floor(amountTokens * 1e9);
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: treasury.publicKey,
                    toPubkey: recipientPubKey,
                    lamports: lamports
                })
            );

            const txSignature = await connection.sendTransaction(transaction, [treasury]);
            await connection.confirmTransaction(txSignature, 'confirmed');

            const explorerUrl = `https://solscan.io/tx/${txSignature}`;
            return {
                success: true,
                txSignature,
                explorerUrl,
                amount: amountTokens,
                recipient: recipientAddress,
                type: 'SOL'
            };
        }

        // Transfer SPL Token
        const mintPubKey = new PublicKey(mintStr);
        const decimals = parseInt(process.env.TOKEN_DECIMALS || '9', 10);
        const rawAmount = BigInt(Math.floor(amountTokens * Math.pow(10, decimals)));

        // Get or Create ATAs for Treasury & Recipient
        const fromAta = await getOrCreateAssociatedTokenAccount(
            connection,
            treasury,
            mintPubKey,
            treasury.publicKey
        );

        const toAta = await getOrCreateAssociatedTokenAccount(
            connection,
            treasury,
            mintPubKey,
            recipientPubKey
        );

        const transferIx = createTransferInstruction(
            fromAta.address,
            toAta.address,
            treasury.publicKey,
            rawAmount,
            [],
            TOKEN_PROGRAM_ID
        );

        const transaction = new Transaction().add(transferIx);
        const txSignature = await connection.sendTransaction(transaction, [treasury]);
        await connection.confirmTransaction(txSignature, 'confirmed');

        const explorerUrl = `https://solscan.io/tx/${txSignature}`;

        return {
            success: true,
            txSignature,
            explorerUrl,
            amount: amountTokens,
            recipient: recipientAddress,
            type: 'SPL'
        };

    } catch (err) {
        console.error('Solana Payout Error:', err);
        return {
            success: false,
            error: err.message
        };
    }
}

module.exports = {
    getTreasuryKeypair,
    sendTokenReward
};
