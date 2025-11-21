# Geckura Discord Bot

A professional Discord bot for the Geckura NFT project on Solana, featuring embed management, whitelist system, roadmap display, and more.

## 🦎 Features

- **Embed Posting Command** (`/embed`) - Create styled embed messages with custom titles, descriptions, images, and colors
- **Whitelist System** (`/whitelist`) - Manage whitelisted users with wallet addresses
- **Role Auto-Assign** - Automatically assigns roles when users get whitelisted
- **Roadmap Command** (`/roadmap`) - Display the project roadmap in a stylized embed
- **Utility Embed Command** (`/utility`) - Show information about Geckura utilities
- **Link Hub Command** (`/links`) - Display social links in an embed
- **Mint Info Command** (`/mintinfo`) - Display mint information and whitelist status
- **Announcement Command** (`/announce`) - Create styled announcement embeds with pings
- **Wallet Verification** (`/verify`) - Allow users to verify their wallet addresses

## 🚀 Setup

### Prerequisites

- Node.js 16.6.0 or higher
- A Discord bot application with the appropriate permissions

### Installation

1. Clone this repository:
   ```
   git clone https://github.com/gh00sty123/geckura.git
   cd geckura
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure the bot:
   - Fill in your bot token, client ID, and guild ID in the `.env` file
   - Update `config.json` with your server-specific settings (role names, channel names, etc.)

4. Register the slash commands:
   ```
   npm run deploy
   ```

5. Start the bot:
   ```
   npm start
   ```

## 📋 Configuration

### Environment Variables (.env)

- `DISCORD_TOKEN`: Your Discord bot token
- `CLIENT_ID`: Your Discord application ID
- `GUILD_ID`: Your Discord server ID (for testing commands)
- `MONGODB_URI`: MongoDB connection string (optional, for production)

### Config File (config.json)

The `config.json` file contains various settings for the bot:

- `colors`: Theme colors for embeds
- `roles`: Role names used by the bot
- `channels`: Channel names for specific functions
- `links`: Social media links
- `footer`: Default footer text for embeds

## 🛠️ Commands

### Admin/Alchemist Only Commands

- `/embed` - Create a styled embed message
- `/whitelist add` - Add a user to the whitelist
- `/whitelist list` - List all whitelisted users
- `/whitelist check` - Check if a user is whitelisted
- `/announce` - Create a styled announcement embed

### Public Commands

- `/roadmap` - Display the project roadmap
- `/utility` - Show information about Geckura utilities
- `/links` - Display social links
- `/mintinfo` - Display mint information and whitelist status
- `/verify` - Verify your wallet address

## 🔐 Security

- Only users with "Admin" or "Alchemist" roles can use admin commands
- Environment variables are used to store sensitive information
- The bot uses role-based permissions to control access to features

## 🎨 Customization

You can customize the bot's appearance and behavior by modifying the `config.json` file:

- Change colors to match your brand
- Update role names to match your server
- Modify the footer text
- Update social media links

## 📝 License

This project is licensed under the MIT License.

## 🦎 Geckura

Geckura — Turning Chaos into Flow

Your trading dojo assistant — guiding Seekers and Alchemists through the Solana flow.
