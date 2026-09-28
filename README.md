# Geckura Discord Bot 🦎

A clean, modern Discord bot for the Geckura Solana ecosystem, featuring NFT flexing, wallet connecting, level/XP system, and community management.

## 🌟 Features

- **NFT Flexing** (`/flex`) — Flex your owned Solana & Geckura NFTs with high-resolution image embeds, collection details, mint address links, and interactive navigation buttons.
- **Wallet Connection** (`/connect` / `/wallet`) — Link your Solana wallet address for NFT flexing, WL, and community rewards.
- **Leveling & Economy** (`/level`, `/balance`, `/daily`, `/leaderboard`) — Chat2Earn system awarding XP and $GECKURA tokens for activity.
- **Embed & Announcements** (`/embed`, `/announce`) — Styled embed message builder and announcement tools.
- **Community Hub** (`/links`, `/roadmap`, `/utility`, `/tweet`) — Display official links, roadmap, utility details, and Twitter raid tracking.

## 🚀 Setup & Installation

### Prerequisites

- Node.js 16.6.0 or higher
- A Discord Bot Application token

### Configuration

1. Clone & install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   ```env
   DISCORD_TOKEN=your_bot_token_here
   CLIENT_ID=your_client_id_here
   GUILD_ID=your_guild_id_here
   ```

3. Register slash commands:
   ```bash
   npm run deploy
   ```

4. Start the bot:
   ```bash
   npm start
   ```

## 🛠️ Slash Commands

### Public Commands
- `/flex` — Flex your owned NFTs from your connected Solana wallet
- `/connect` — Connect your Solana wallet address
- `/raffle enter` — Enter an active Solana NFT/Token raffle with SOL, SPL, or $GECKURA
- `/raffle list` — View all active Solana raffles
- `/wallet` — Submit or check your linked wallet address
- `/my-wallet` — Check your saved wallet address
- `/balance` — View your current $GECKURA token balance & XP
- `/daily` — Claim daily $GECKURA tokens & XP
- `/level` — Check your rank, level, and XP progress
- `/leaderboard` — View server XP and token rankings
- `/roadmap` — Display the project roadmap
- `/utility` — View Geckura ecosystem utility details
- `/links` — Display official links and social media hubs

### Admin & Staff Commands
- `/raffle create` — Create a new Solana NFT/Token raffle with custom treasury wallet & ticket price
- `/raffle draw` — Draw a verifiable winner for a raffle
- `/admin` — Access admin setup and configuration panel
- `/embed` — Build custom styled Discord embeds
- `/announce` — Send stylized announcement embeds
- `/wallets` — View and search submitted member wallets
- `/reset-ranks` — Reset server XP/ranks
- `/welcome-setup` — Configure welcome channel and rules

## 🔐 Security & Moderation

- **Impersonation Guard**: Automatic detection and banning of accounts impersonating team members, founders, or official bots.
- **Anti-Spam & Link Filter**: Automatic message rate-limiting and link moderation.
- **Invite Tracking**: Automatic reward system for inviing members (with automatic chargebacks if invited members leave).

## 🦎 Geckura
*Geckura — Turning Chaos into Flow*
