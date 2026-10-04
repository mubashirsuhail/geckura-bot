const { Connection, Keypair, PublicKey, SystemProgram, Transaction } = require('@solana/web3.js');
const { getAssociatedTokenAddress, getOrCreateAssociatedTokenAccount, createTransferInstruction, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
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
    const rpcUrl = process.env.SOLANA_RPC || process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    return new Connection(rpcUrl, 'confirmed');
}

/**
 * Send SPL Token Reward (e.g. $GECKURA) to recipient wallet address
 * Rules:
 * 1. User MUST have a linked Solana wallet.
 * 2. User MUST have an initialized Associated Token Account (ATA) with at least 1 token held.
 * 
 * @param {string} recipientAddress - Solana wallet address of the winner
 * @param {number} amountTokens - Amount of tokens to transfer
 * @param {string} [tokenMintAddress] - SPL Token mint address
 */
async function sendTokenReward(recipientAddress, amountTokens, tokenMintAddress) {
    const mintStr = tokenMintAddress || process.env.GECKURA_TOKEN_MINT;

    if (!recipientAddress) {
        return {
            success: false,
            error: 'NO_WALLET_CONNECTED',
            message: '⚠️ Winner has not connected a Solana wallet via `/wallet set`.'
        };
    }

    if (!process.env.SOLANA_TREASURY_SECRET_KEY) {
        return {
            success: false,
            simulated: true,
            error: 'KEY_UNCONFIGURED',
            message: 'SOLANA_TREASURY_SECRET_KEY not set in .env yet.'
        };
    }

    try {
        const connection = getSolanaConnection();
        const treasury = getTreasuryKeypair();
        const recipientPubKey = new PublicKey(recipientAddress);

        if (!mintStr) {
            // Native SOL transfer if no SPL mint is set
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

        // SPL Token Transfer with mandatory ATA & 1 Token balance check
        const mintPubKey = new PublicKey(mintStr);
        const recipientAta = await getAssociatedTokenAddress(mintPubKey, recipientPubKey);

        // Check if Recipient ATA account exists on-chain
        const ataInfo = await connection.getAccountInfo(recipientAta);
        if (!ataInfo) {
            return {
                success: false,
                error: 'NO_ATA_FOUND',
                message: '❌ Winner does not have an active Token Account (ATA) initialized for this token.'
            };
        }

        // Check if Recipient holds at least 1 token
        try {
            const balanceResponse = await connection.getTokenAccountBalance(recipientAta);
            const uiBalance = balanceResponse.value.uiAmount || 0;

            if (uiBalance < 1) {
                return {
                    success: false,
                    error: 'INSUFFICIENT_ATA_BALANCE',
                    message: `❌ Winner ATA balance is ${uiBalance} tokens. Must hold at least 1 token to receive automated transfer.`
                };
            }
        } catch (balErr) {
            return {
                success: false,
                error: 'ATA_BALANCE_CHECK_FAILED',
                message: '❌ Failed to verify recipient Token Account balance.'
            };
        }

        // Execute Transfer
        const decimals = parseInt(process.env.TOKEN_DECIMALS || '9', 10);
        const rawAmount = BigInt(Math.floor(amountTokens * Math.pow(10, decimals)));

        const fromAta = await getAssociatedTokenAddress(mintPubKey, treasury.publicKey);

        const transferIx = createTransferInstruction(
            fromAta,
            recipientAta,
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
            error: 'PAYOUT_EXCEPTION',
            message: err.message
        };
    }
}

module.exports = {
    getTreasuryKeypair,
    sendTokenReward
};
