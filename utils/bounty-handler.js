const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

const bountiesPath = path.join(__dirname, '..', 'data', 'bounties.json');

function getBountyData() {
    if (!fs.existsSync(bountiesPath)) {
        const initial = { remainingSupply: 30, totalSupply: 30, claims: [] };
        fs.writeFileSync(bountiesPath, JSON.stringify(initial, null, 2));
        return initial;
    }
    try {
        return JSON.parse(fs.readFileSync(bountiesPath, 'utf8'));
    } catch (err) {
        console.error('Error reading bounties.json:', err);
        return { remainingSupply: 30, totalSupply: 30, claims: [] };
    }
}

function saveBountyData(data) {
    try {
        fs.writeFileSync(bountiesPath, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error writing bounties.json:', err);
    }
}

function buildBountyEmbed(client, config, customRemaining = null) {
    const data = getBountyData();
    const remaining = customRemaining !== null ? customRemaining : data.remainingSupply;
    const primaryColor = parseInt(config?.colors?.primary?.replace('#', '') || '00FF99', 16);

    const embed = new EmbedBuilder()
        .setTitle('🚨 GECKURA EXCLUSIVE MINT BOUNTY — LIMITED SUPPLY! 🚨')
        .setDescription(
            `🔥 **LIMITED TIME PROMOTION — ONLY \`${remaining}\` MINTS REMAINING!** 🔥\n\n` +
            `Supercharge your Geckura holder status with our official **Mint Bounty Rewards**! ` +
            `Mint your Geckura NFTs on TribeX now and claim exclusive bonuses, custom 1-of-1 NFTs, Mystery Box revshare, and Mystery NFTs.`
        )
        .setColor(primaryColor)
        .setThumbnail(client.user?.displayAvatarURL())
        .setImage(config?.links?.banner || 'https://i.imgur.com/GeckuraBanner.png')
        .addFields(
            {
                name: '🎁 TIER 1: MINT 5 → GET 1 FREE 🎟️',
                value: '• **Requirement:** Mint **5 Geckura NFTs**\n' +
                       '• **Reward:** Receive **1 Bonus Geckura NFT FREE**!\n' +
                       '• Instant holder role upgrade & staking yield boost',
                inline: false
            },
            {
                name: '👑 TIER 2: MINT 20 → CUSTOM 1-OF-1 + REVSHARE + MYSTERY NFT 💎',
                value: '• **Requirement:** Mint **20 Geckura NFTs**\n' +
                       '• **Reward 1:** **1 Custom 1-of-1 Geckura NFT** tailored for you!\n' +
                       '• **Reward 2:** **Revenue Share (Revshare)** from Geckura Mystery Box platform services!\n' +
                       '• **Reward 3:** **1 Bonus Mystery NFT** awarded on every 20 mints!\n' +
                       '• Top-tier VIP access & direct governance council seat',
                inline: false
            },
            {
                name: '⚡ URGENCY ALERT',
                value: `⚠️ Only **\`${remaining}\` NFTs** remain in total supply! Once sold out, these mint bounty perks will close permanently.`,
                inline: false
            },
            {
                name: '📥 How to Claim Your Bounty',
                value: '1. Click **🚀 Mint Live on TribeX** below and complete your mint.\n' +
                       '2. Click **📥 Claim Mint Bounty** to submit your transaction hash.\n' +
                       '3. Our team will verify your mint on-chain and dispatch your rewards!',
                inline: false
            }
        )
        .setFooter({ text: config?.footer || 'Geckura Mint Bounty — Turning Chaos into Flow!', iconURL: client.user?.displayAvatarURL() })
        .setTimestamp();

    return embed;
}

function buildBountyButtons(config) {
    const mintUrl = config?.links?.mintSite || 'https://launchpad.tribexlabs.xyz/geckura';
    
    return [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('🚀 Mint Live on TribeX')
                .setStyle(ButtonStyle.Link)
                .setURL(mintUrl),

            new ButtonBuilder()
                .setCustomId('bounty_claim_btn')
                .setLabel('📥 Claim Mint Bounty')
                .setStyle(ButtonStyle.Success)
                .setEmoji('💎'),

            new ButtonBuilder()
                .setCustomId('bounty_status_btn')
                .setLabel('📊 Check Supply & Claims')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('📈'),

            new ButtonBuilder()
                .setLabel('🎁 Mystery Box Portal')
                .setStyle(ButtonStyle.Link)
                .setURL(config?.links?.mysteryBox || 'https://mysterybox.geckura.app/')
        )
    ];
}

async function handleBountyButton(interaction, client, config) {
    const customId = interaction.customId;

    if (customId === 'bounty_claim_btn') {
        const modal = new ModalBuilder()
            .setCustomId('bounty_claim_modal')
            .setTitle('🎁 Submit Geckura Mint Bounty Claim');

        const txInput = new TextInputBuilder()
            .setCustomId('bounty_tx_input')
            .setLabel('Solana TX Signature / Mint Hash')
            .setPlaceholder('Paste your Solana transaction signature from Solscan...')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const walletInput = new TextInputBuilder()
            .setCustomId('bounty_wallet_input')
            .setLabel('Your Solana Wallet Address')
            .setPlaceholder('Paste Phantom/Solflare wallet address...')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const countInput = new TextInputBuilder()
            .setCustomId('bounty_count_input')
            .setLabel('Number of NFTs Minted (e.g. 5 or 20)')
            .setPlaceholder('Enter total mint count (5 = 1 Free, 20 = Custom 1-of-1 + Revshare + Mystery NFT)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const row1 = new ActionRowBuilder().addComponents(txInput);
        const row2 = new ActionRowBuilder().addComponents(walletInput);
        const row3 = new ActionRowBuilder().addComponents(countInput);

        modal.addComponents(row1, row2, row3);
        return await interaction.showModal(modal);
    }

    if (customId === 'bounty_status_btn') {
        const data = getBountyData();
        const userClaims = data.claims.filter(c => c.userId === interaction.user.id);

        const embed = new EmbedBuilder()
            .setTitle('📊 GECKURA MINT BOUNTY LIVE STATUS')
            .setColor(0x00FF99)
            .addFields(
                { name: '🔥 Remaining Bounty Supply', value: `\`${data.remainingSupply} / ${data.totalSupply}\` NFTs`, inline: true },
                { name: '📥 Total Claim Submissions', value: `\`${data.claims.length}\` Submissions`, inline: true },
                { name: '👤 Your Submissions', value: `\`${userClaims.length}\` Submitted`, inline: true }
            )
            .setFooter({ text: 'Geckura Mint Bounty System' })
            .setTimestamp();

        if (userClaims.length > 0) {
            const claimDetails = userClaims.map((c, i) => 
                `**#${i + 1}** — Wallet: \`${c.wallet.slice(0, 6)}...${c.wallet.slice(-4)}\` | Mints: **${c.mintsCount}** | Status: **${c.status.toUpperCase()}**`
            ).join('\n');
            embed.addFields({ name: '📜 Your Claim History', value: claimDetails, inline: false });
        }

        return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (customId.startsWith('bounty_approve_') || customId.startsWith('bounty_reject_')) {
        const isApprove = customId.startsWith('bounty_approve_');
        const claimId = customId.replace(isApprove ? 'bounty_approve_' : 'bounty_reject_', '');

        const data = getBountyData();
        const claim = data.claims.find(c => c.id === claimId);

        if (!claim) {
            return await interaction.reply({ content: '⚠️ Claim record not found.', ephemeral: true });
        }

        if (claim.status !== 'pending') {
            return await interaction.reply({ content: `⚠️ This claim is already **${claim.status.toUpperCase()}**.`, ephemeral: true });
        }

        claim.status = isApprove ? 'approved' : 'rejected';
        claim.processedBy = interaction.user.id;
        claim.processedAt = new Date().toISOString();

        if (isApprove) {
            // Deduct mints from remaining supply if tier met
            data.remainingSupply = Math.max(0, data.remainingSupply - (parseInt(claim.mintsCount) || 1));
        }

        saveBountyData(data);

        // Send confirmation in interaction
        const statusText = isApprove ? '✅ **APPROVED**' : '❌ **REJECTED**';
        await interaction.update({
            content: `📢 Mint Bounty Claim #${claimId} has been ${statusText} by <@${interaction.user.id}>!`,
            components: []
        });

        // DM the user who submitted the claim
        try {
            const user = await client.users.fetch(claim.userId);
            if (user) {
                const dmEmbed = new EmbedBuilder()
                    .setTitle(isApprove ? '🎉 MINT BOUNTY CLAIM APPROVED!' : '⚠️ MINT BOUNTY CLAIM REJECTED')
                    .setColor(isApprove ? 0x00FF99 : 0xFF5555)
                    .setDescription(
                        isApprove
                            ? `Congratulations! Your Mint Bounty claim for **${claim.mintsCount} NFTs** has been verified and approved.\n\n` +
                              `🎁 **Rewards:** ${parseInt(claim.mintsCount) >= 20 ? '1 Custom 1-of-1 NFT + Mystery Box Revshare Access + 1 Mystery NFT!' : '1 Bonus Free NFT!'}\n` +
                              `Our founders will reach out shortly for asset transfer & role assignment!`
                            : `Your Mint Bounty claim submission for **${claim.mintsCount} NFTs** was rejected. If you believe this is an error, please open a support ticket in Discord.`
                    )
                    .setTimestamp();
                await user.send({ embeds: [dmEmbed] });
            }
        } catch (e) {
            console.log('Could not DM user regarding bounty claim approval/rejection:', e);
        }
    }
}

async function handleBountyModalSubmit(interaction, client, config) {
    await interaction.deferReply({ ephemeral: true });

    const txSig = interaction.fields.getTextInputValue('bounty_tx_input').trim();
    const wallet = interaction.fields.getTextInputValue('bounty_wallet_input').trim();
    const mintsCountStr = interaction.fields.getTextInputValue('bounty_count_input').trim();
    const mintsCount = parseInt(mintsCountStr) || 0;

    if (!txSig || txSig.length < 30) {
        return await interaction.editReply({ content: '⚠️ **Invalid TX Signature:** Please provide a valid Solana transaction hash.' });
    }

    if (!wallet || wallet.length < 32) {
        return await interaction.editReply({ content: '⚠️ **Invalid Wallet Address:** Please provide a valid Solana wallet address.' });
    }

    if (mintsCount <= 0) {
        return await interaction.editReply({ content: '⚠️ **Invalid Mint Count:** Please enter a number greater than 0.' });
    }

    const data = getBountyData();

    // Check duplicate TX
    if (data.claims.some(c => c.txSig === txSig)) {
        return await interaction.editReply({ content: '⚠️ **Duplicate TX Submission:** This transaction hash has already been submitted.' });
    }

    const claimId = `claim_${Date.now()}`;
    const newClaim = {
        id: claimId,
        userId: interaction.user.id,
        userTag: interaction.user.tag,
        txSig: txSig,
        wallet: wallet,
        mintsCount: mintsCount,
        status: 'pending',
        submittedAt: new Date().toISOString()
    };

    data.claims.push(newClaim);
    saveBountyData(data);

    let tierMsg = '';
    if (mintsCount >= 20) {
        tierMsg = '👑 **TIER 2 QUALIFIED!** You are eligible for **1 Custom 1-of-1 NFT**, **Mystery Box Platform Revshare**, and **1 Mystery NFT**!';
    } else if (mintsCount >= 5) {
        tierMsg = '🎁 **TIER 1 QUALIFIED!** You are eligible for **1 Bonus Free NFT**!';
    } else {
        tierMsg = `📍 **${mintsCount} Mints Submitted.** Reach 5 mints for a Free NFT, or 20 mints for Custom 1-of-1 + Revshare + Mystery NFT!`;
    }

    const replyEmbed = new EmbedBuilder()
        .setTitle('✅ MINT BOUNTY CLAIM SUBMITTED!')
        .setColor(0x00FF99)
        .setDescription(
            `Your mint bounty claim has been logged successfully and sent to our team for verification!\n\n` +
            `📍 **Wallet:** \`${wallet}\`\n` +
            `🔗 **TX Hash:** [\`${txSig.slice(0, 10)}...\`](https://solscan.io/tx/${txSig})\n` +
            `🔢 **Mints Count:** **${mintsCount}**\n\n` +
            `${tierMsg}`
        )
        .setFooter({ text: 'Geckura Mint Bounty System' })
        .setTimestamp();

    await interaction.editReply({ embeds: [replyEmbed] });

    // Send Admin Notification to Mod/Logs Channel
    const alertChannel = interaction.guild.channels.cache.find(c => 
        c.name === 'mod-logs' || c.name === 'logs' || c.name === 'alerts' || c.name === 'staff-chat' || c.name === 'admin'
    );

    if (alertChannel) {
        try {
            const adminEmbed = new EmbedBuilder()
                .setTitle('📥 NEW MINT BOUNTY CLAIM SUBMISSION')
                .setColor(mintsCount >= 20 ? 0x9D4EDD : 0x00FF99)
                .setDescription(`User <@${interaction.user.id}> submitted a new Mint Bounty claim!`)
                .addFields(
                    { name: 'User Tag', value: interaction.user.tag, inline: true },
                    { name: 'User ID', value: `\`${interaction.user.id}\``, inline: true },
                    { name: 'Mints Count', value: `**${mintsCount}**`, inline: true },
                    { name: 'Wallet Address', value: `\`${wallet}\``, inline: false },
                    { name: 'TX Signature', value: `[View on Solscan](https://solscan.io/tx/${txSig})`, inline: false },
                    { name: 'Tier Qualification', value: tierMsg, inline: false }
                )
                .setFooter({ text: `Claim ID: ${claimId}` })
                .setTimestamp();

            const actionRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`bounty_approve_${claimId}`)
                    .setLabel('Approve Claim')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`bounty_reject_${claimId}`)
                    .setLabel('Reject Claim')
                    .setStyle(ButtonStyle.Danger)
            );

            await alertChannel.send({ embeds: [adminEmbed], components: [actionRow] });
        } catch (e) {
            console.error('Error posting bounty claim to admin channel:', e);
        }
    }
}

module.exports = {
    getBountyData,
    saveBountyData,
    buildBountyEmbed,
    buildBountyButtons,
    handleBountyButton,
    handleBountyModalSubmit
};
