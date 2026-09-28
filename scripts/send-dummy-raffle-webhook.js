const fetch = require('node-fetch');

const WEBHOOK_URL = 'https://discord.com/api/webhooks/1540415609622495364/eaVT3GTF4XJYTy7Z-8h1EWYICyk2DWquEYjJyABrXw-YJlN3F-tnAQNi-Pn3zRXUZ1Qw';

const endTimestamp = Math.floor(Date.now() / 1000) + (4 * 3600);

const payload = {
  content: '🎉 **NEW SOLANA NFT RAFFLE IS LIVE!**',
  embeds: [
    {
      title: '💸 Raffle #7F2A — Geckura Elixir Legend #420',
      description: `🟢 **LIVE — ends <t:${endTimestamp}:R>**\n\n**Prize:** **Geckura Elixir Legend #420**\n\`7fDs...qkkQ\`\n\n🎟️ **Tickets — 342 / 500 sold (68%)**\n*Sales stop when every ticket is sold; the draw then runs immediately.*\n\n💵 **Ticket Price**\n\`0.25 SOL\` each *(+ \`0.001 SOL\` platform fee)*`,
      color: 65433,
      fields: [
        {
          name: '⚡ How to Participate',
          value: '• Click **Buy Tickets** in Discord or send `0.25 SOL` to treasury:\n\`\`\`\n7fDsMz6mv1Bkz5b6FYjcok8WxFsk7YJ2RfKxEt2oqkkQ\n\`\`\`\n• Paste your Solana Transaction Hash to confirm ticket receipt.'
        },
        {
          name: '🛡️ Verifiable Fairness',
          value: 'Provably fair on-chain winner selection upon sellout or timer expiry.'
        }
      ],
      image: {
        url: 'https://i.imgur.com/GeckuraBanner.png'
      },
      footer: {
        text: 'Tickets are verified on-chain • unspent funds refunded if cancelled • winner drawn verifiably after close'
      },
      timestamp: new Date().toISOString()
    }
  ]
};

async function sendWebhook() {
  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok || res.status === 204) {
      console.log('✅ Dummy raffle embed posted successfully to webhook!');
    } else {
      const text = await res.text();
      console.error(`⚠️ Webhook post failed with status ${res.status}: ${text}`);
    }
  } catch (err) {
    console.error('Error sending webhook:', err);
  }
}

sendWebhook();
