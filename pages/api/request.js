const { OAuth2Client } = require("google-auth-library");

// from front end, ping to generate authorization url
export default async function handler(req, res) {
  if (req.method === "POST") {
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
    res.setHeader("Referrer-Policy", "no-referrer-when-downgrade"); // Since we're using http instead of https

    const redirectUrl = "http://127.0.0.1:3000/api/oauth";

    const oAuth2Client = new OAuth2Client(
      process.env.CLIENT_ID, // CLIENT_ID used to redirect users to Google's authorization endpoint
      process.env.CLIENT_SECRET, // used to authenticate the application (not the user) when exchanging the authorization code for an access token
      redirectUrl
    );

    // generate url to ping google with
    const authorizeUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: "https://www.googleapis.com/auth/userinfo.profile openid",
      prompt: "consent",
    });

    res.json({ url: authorizeUrl });
  }
}
