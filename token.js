// api/discord/token.js
// Vercel Serverless Function để xử lý Discord OAuth

const DISCORD_CLIENT_ID = '1416381905024323755';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET; // Set in Vercel env vars
const DISCORD_REDIRECT_URI = 'https://mydiscordprofile.vercel.app';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ error: 'Authorization code is required' });
    }

    if (!DISCORD_CLIENT_SECRET) {
        return res.status(500).json({ error: 'Server configuration error: Missing client secret' });
    }

    try {
        // Exchange authorization code for access token
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: DISCORD_CLIENT_ID,
                client_secret: DISCORD_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: DISCORD_REDIRECT_URI,
            }),
        });

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json();
            console.error('Discord token exchange error:', errorData);
            return res.status(400).json({ 
                error: 'Failed to exchange code for token',
                details: errorData 
            });
        }

        const tokenData = await tokenResponse.json();

        // Return tokens to client
        res.status(200).json({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_in: tokenData.expires_in,
            token_type: tokenData.token_type,
            scope: tokenData.scope
        });

    } catch (error) {
        console.error('Token exchange error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
}
