const { OAuth2Client } = require("google-auth-library");

async function getUserData(access_token) {
  const response = await fetch(
    `https://www.googleapis.com/oauth2/v3/userinfo?access_token${access_token}`
  );
  const data = await response.json();
  console.log("data", data);
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    let user = null;
    const code = req.query.code;
    console.log("Code google sent back: ", code);
    try {
      const redirectUrl = "http://127.0.0.1:3000/api/oauth";

      const oAuth2Client = new OAuth2Client(
        process.env.CLIENT_ID, // CLIENT_ID used to redirect users to Google's authorization endpoint
        process.env.CLIENT_SECRET, // used to authenticate the application (not the user) when exchanging the authorization code for an access token
        redirectUrl
      );

      const res = await oAuth2Client.getToken(code);
      await oAuth2Client.setCredentials(res.tokens);

      console.log("Tokens acquired");
      user = oAuth2Client.credentials;
      console.log("credentials", user);
      await getUserData(user.access_token);
    } catch (err) {
      console.log("Error with signing in with Google");
    }

    res.redirect(
      303,
      `http://localhost:3000/Pages/Home?accessToken=${
        user && user.access_token
      }`
    );
  }
}
