import { prisma, CLIENT_URL, addResCookie } from "./config";
import axios from "axios";
import { Request, Response } from "express";

const TWITTER_OAUTH_CLIENT_ID = "T1dLaHdFSWVfTnEtQ2psZThTbnI6MTpjaQ";
const TWITTER_OAUTH_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET!;
const TWITTER_OAUTH_TOKEN_URL = "https://api.twitter.com/2/oauth2/token";
const BasicAuthToken = Buffer.from(`${TWITTER_OAUTH_CLIENT_ID}:${TWITTER_OAUTH_CLIENT_SECRET}`, "utf8").toString(
  "base64"
);

export const twitterOauthTokenParams = {
  client_id: TWITTER_OAUTH_CLIENT_ID,
  code_verifier: "challenge",
  // http://www.localhost:3005/v1/oauth/twitter
  redirect_uri: `https://www.localhost:3001/oauth/twitter`,
  grant_type: "authorization_code",
};

// the shape of the object we should recieve from twitter
type TwitterTokenResponse = {
  token_type: "bearer";
  expires_in: 7200;
  access_token: string;
  scope: string;
};

export async function getTwitterOAuthToken(code: string) {
  try {
    const res = await axios.post<TwitterTokenResponse>(
      TWITTER_OAUTH_TOKEN_URL,
      new URLSearchParams({ ...twitterOauthTokenParams, code }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${BasicAuthToken}`,
        },
      }
    );

    return res.data;
  } catch (err) {
    console.error(err);

    return null;
  }
}

interface TwitterUser {
  id: string;
  name: string;
  username: string;
}

export async function getTwitterUser(accessToken: string): Promise<TwitterUser | null> {
  try {
    const res = await axios.get<{ data: TwitterUser }>("https://api.twitter.com/2/users/me", {
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return res.data.data ?? null;
  } catch (err) {
    console.error(err);

    return null;
  }
}

export async function twitterOauth(req: Request, res: Response) {
  const code = req.query.code as string;

  // get the access token with the code
  const TwitterOAuthToken = await getTwitterOAuthToken(code);

  // console.log(TwitterOAuthToken);

  if (!TwitterOAuthToken) {
    return res.redirect(CLIENT_URL);
  }

  const twitterUser = await getTwitterUser(TwitterOAuthToken.access_token);
  if (!twitterUser) {
    return res.redirect(CLIENT_URL);
  }

  const user = await prisma.user.upsert({
    create: {
      username: twitterUser.username,
      id: twitterUser.id,
      name: twitterUser.name,
      type: "twitter",
    },
    update: {
      id: twitterUser.id,
    },
    where: { id: twitterUser.id },
  });

  addResCookie({
    res,
    user,
    accessToken: TwitterOAuthToken.access_token,
    duration: TwitterOAuthToken.expires_in + 3600,
  });

  return res.redirect(CLIENT_URL);
}
