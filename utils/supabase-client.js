const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://uwvsftcctylihdqczxhv.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
    try {
        supabase = createClient(supabaseUrl, supabaseKey);
        console.log('⚡ Supabase client initialized successfully.');
    } catch (err) {
        console.error('⚠️ Supabase Client Init Error:', err.message);
    }
} else {
    console.log('ℹ️ Supabase key not set in environment (SUPABASE_KEY). Local JSON backup active.');
}

/**
 * Upsert user profile, balance, and Solana wallet to Supabase
 * @param {string} userId Discord User ID
 * @param {object} userData User Chat2Earn & Wallet data object
 */
async function syncUserToSupabase(userId, userData) {
    if (!supabase) return;

    try {
        const record = {
            discord_id: userId,
            solana_wallet: userData.solanaWallet || null,
            tokens: userData.tokens || 0,
            level: userData.level || 1,
            experience: userData.experience || 0,
            messages_count: userData.messagesCount || 0,
            total_tokens_earned: userData.totalTokensEarned || 0,
            total_withdrawn: userData.totalWithdrawn || 0,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('user_wallets')
            .upsert(record, { onConflict: 'discord_id' });

        if (error) {
            // Fallback try table 'users'
            const { error: err2 } = await supabase
                .from('users')
                .upsert(record, { onConflict: 'discord_id' });
            if (err2) {
                console.warn('Supabase sync warning:', error.message || err2.message);
            }
        }
    } catch (e) {
        console.warn('Supabase sync exception:', e.message);
    }
}

/**
 * Record a token withdrawal event to Supabase
 * @param {object} withdrawalData Details of withdrawal transaction
 */
async function syncWithdrawalToSupabase(withdrawalData) {
    if (!supabase) return;

    try {
        const record = {
            discord_id: withdrawalData.userId,
            wallet_address: withdrawalData.walletAddress,
            amount: withdrawalData.amount,
            tx_signature: withdrawalData.txSignature || null,
            status: withdrawalData.status || 'CONFIRMED',
            created_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('withdrawals')
            .insert([record]);

        if (error) {
            console.warn('Supabase withdrawal sync warning:', error.message);
        }
    } catch (e) {
        console.warn('Supabase withdrawal sync exception:', e.message);
    }
}

module.exports = {
    supabase,
    syncUserToSupabase,
    syncWithdrawalToSupabase
};
