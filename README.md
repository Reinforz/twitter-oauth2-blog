# Implementing Authentication with Twitter OAuth 2.0 using Typescript, Express.js and Next.js

## Implementing Authentication with Twitter OAuth 2.0 using Typescript, Node.js, Express.js and Next.js in a Full Stack Application

## Table of contents

- [Implementing Authentication with Twitter OAuth 2.0 using Typescript, Express.js and Next.js](#implementing-authentication-with-twitter-oauth-20-using-typescript-expressjs-and-nextjs)
  - [Implementing Authentication with Twitter OAuth 2.0 using Typescript, Node.js, Express.js and Next.js in a Full Stack Application](#implementing-authentication-with-twitter-oauth-20-using-typescript-nodejs-expressjs-and-nextjs-in-a-full-stack-application)
  - [Table of contents](#table-of-contents)
  - [What will we learn](#what-will-we-learn)
  - [Requirements](#requirements)
  - [Project Setup](#project-setup)
    - [Client setup](#client-setup)
    - [Server setup](#server-setup)
  - [Twitter OAuth2 Implementation](#twitter-oauth2-implementation)
    - [Setup twitter user authentication settings](#setup-twitter-user-authentication-settings)
    - [Client](#client)
      - [Frontend authentication button](#frontend-authentication-button)
      - [Me query](#me-query)
      - [Styling](#styling)
    - [Server](#server)
      - [Getting the access token with the code](#getting-the-access-token-with-the-code)
      - [Getting the Twitter User from access token](#getting-the-twitter-user-from-access-token)
      - [Checking if they work](#checking-if-they-work)
  - [Finishing the web app](#finishing-the-web-app)
  - [Conclusion](#conclusion)

## What will we learn
Here, we will learn to implement authentication using Twitter OAuth 2.0 on a minimal working full-stack web application. We will not be using Passport.js or similar libraries to handle authentication for us. As a result, we will understand the OAuth 2.0 flow better. We will also learn about the following stacks:
- [express.js](https://expressjs.com/) backend framework
- [prisma](https://www.prisma.io/) to create and login users, you can really use anything to communicate with any database.
- [next.js](https://nextjs.org/), a [React.js](https://reactjs.org/) framework, for the frontend
- [typescript](https://www.typescriptlang.org/) (optional) type-safety for javascript

## Requirements
Anyone with a basic knowledge of javascript can follow along with this blog.
If you already have a similar project setup, you can also jump straight to the [Twitter OAuth2 Implementation](#twitter-oauth2-implementation) section.

## Project Setup
Firstly, let's add a `package.json` file at the root directory and add the following content:

```json
{
  "private": true,
  "workspaces": [
    "server",
    "client"
  ],
  "scripts": {
    "client:dev": "yarn workspace client dev",
    "server:dev": "yarn workspace server dev",
    "client:add": "yarn workspace client add",
    "server:add": "yarn workspace server add",
    "migrate-db": "yarn workspace server prisma-migrate"
  }
}
```
You can set up version control in this directory, but that is optional. Either way, we will now add a client and server for our web app.
### Client setup
Make a Next.js app by running the following commands:
```bash
yarn create next-app --typescript client
```
Skip the `--typescript` flag if you want to work with javascript.

This will create a `client` folder in the project directory. Navigate there and delete the files we don't need, i.e. `client\styles\Home.module.css` and `client\pages\api`. Also, let's replace all the code in `client\pages\index.ts` with the following:
```ts
import { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <div className="column-container">
      <p>Hello!</p>
    </div>
  );
};

export default Home;
```
Starting the client with our command `yarn client:dev` and going to the address at http://www.localhost:3000/ should display a webpage saying `Hello!`

![Web page saying hello!](https://raw.githubusercontent.com/Reinforz/twitter-oauth2-blog/main/images/1.png)

Now that the frontend is set up, let's move on to our backend.

### Server setup
Make a directory called `server` and make a `package.json` file in the project directory with the following content:
```json
{
  "name": "server",
  "version": "1.0.0",
  "scripts": {
    "start": "node dist/index.js",
    "build": "tsc --sourceMap false",
    "build:watch": "tsc -w",
    "start:watch": "nodemon dist/index.js",
    "dev": "concurrently \"yarn build:watch\" \"yarn start:watch\" --names \"tsc,node\" -c \"blue,green\"",
    "prisma-migrate": "prisma migrate dev",
    "prisma-gen": "prisma generate"
  }
}
```
Here, we added various scripts to help us in our development stage. We will mostly use the `dev` and the `migrate-db` scripts. They allow us to start the server in watch mode and let us migrate the database respectively. Now we can return to the workspace directory and use our `yarn server:add` to add packages. So its time to install the required dependencies using the following commands in the terminal:
```bash
yarn server:add @prisma/client argon2 axios cookie-parser cors dotenv express jsonwebtoken
```
```bash
yarn server:add -D nodemon prisma typescript concurrently @types/cookie-parser @types/cors @types/express @types/jsonwebtoken @types/node
```
After installing the dependencies we need, make a few files to have a minimal running express server:
- `server/tsconfig.json` Edit according to preferences or skip if not using typescript
  ```json
  {
    "compilerOptions": {
      "target": "ES2018",
      "module": "commonjs",
      "lib": [
        "esnext", "esnext.asynciterable"
      ],
      "strict": true,
      "skipLibCheck": true,
      "sourceMap": true,
      "declaration": true,
      "moduleResolution": "node",
      "noImplicitAny": true,
      "strictNullChecks": true,
      "strictFunctionTypes": true,
      "noImplicitThis": true,
      "noUnusedLocals": true,
      "noUnusedParameters": true,
      "noImplicitReturns": true,
      "noFallthroughCasesInSwitch": true,
      "allowSyntheticDefaultImports": true,
      "esModuleInterop": true,
      "emitDecoratorMetadata": true,
      "experimentalDecorators": true,
      "resolveJsonModule": true,
      "incremental": false,
      "baseUrl": "./src",
      "watch": false,
      "removeComments": true,
      "outDir": "./dist",
      "rootDir": "./src"
    },
    "types": ["node"],
    "include": ["./src/**/*.ts"],
  }
  ```
- `server/src/index.ts` to listen to the server.
  ```ts
  import { CLIENT_URL, SERVER_PORT } from "./config";
  import cookieParser from "cookie-parser";
  import cors from "cors";
  import express from "express";

  const app = express();

  const origin = [CLIENT_URL];

  app.use(cookieParser());
  app.use(cors({
    origin,
    credentials: true
  }))

  app.get("/ping", (_, res) => res.json("pong"));

  app.listen(SERVER_PORT, () => console.log(`Server listening on port ${SERVER_PORT}`))
  ```
- `server/src/config.ts` to export some constant configuration variables
  ```ts
  import { PrismaClient } from "@prisma/client"

  export const CLIENT_URL = process.env.CLIENT_URL!
  export const SERVER_PORT = process.env.SERVER_PORT!

  export const prisma = new PrismaClient()
  ```
- `server/.env` to setup the port, client URL and database URL for the server. Make sure to ignore this file if you are working with version control
  ```dotenv
  DATABASE_URL=postgres://postgres:postgres@localhost:5432/twitter-oauth2
  CLIENT_URL=http://www.localhost:3000
  SERVER_PORT=3001
  ```
- `server/prisma/schema.prisma` to let prisma handle the database structure
  ```prisma
  generator client {
    provider = "prisma-client-js"
  }

  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }

  enum UserType {
    local
    twitter
  }

  model User {
    id       String   @id @default(uuid())
    name     String
    username String   @unique
    type     UserType @default(local)
  }
  ```
Now migrate the database using the `yarn migrate-db` command, and then we can run the server using `yarn server:dev`.

We should now be able to ping our server at http://localhost:3001/ping

![Response of the request is "pong"](https://raw.githubusercontent.com/Reinforz/twitter-oauth2-blog/main/images/2.png)

## Twitter OAuth2 Implementation
We are ready to implement authentication via Twitter OAuth 2.0 into our app. We will follow [this](https://developer.twitter.com/en/docs/authentication/oauth-2-0/authorization-code) approach to do so. 
Firstly, we have to make an app on Twitter.
### Setup twitter user authentication settings
Head over to [twitter's developer portal](https://developer.twitter.com/en/portal/dashboard) and make a project and a development app in the project with any name. Twitter will show you the things needed. It may take a few hours to get approval from Twitter to make these apps. Once it is done, head over to the settings page of the app to set some necessary fields.
Set up or edit the user authentication as needed by your app.

![Edit user authentication set up](https://raw.githubusercontent.com/Reinforz/twitter-oauth2-blog/main/images/3.png)

As I only need to read profile information for this minimal web app, these are the settings I used:

![App permissions: Read, no request emails; App type: Web app](https://raw.githubusercontent.com/Reinforz/twitter-oauth2-blog/main/images/4.png)

![Callback URI: http://www.localhost:3001/oauth/twitter, Website URL: http://www.localhost:3000](https://raw.githubusercontent.com/Reinforz/twitter-oauth2-blog/main/images/5.png)

Save the Twitter Client ID and client secret securely.
> **Note**: http://www.localhost:3000 works but not http://localhost:3000. 
> So, I added `www.` in both websites.

### Client
#### Frontend authentication button
Now we add the button in the client, which will lead to our backend for authentication.
To do so, we need to use a valid Twitter OAuth URL getter function and a button to go to the URL.
```ts
import twitterIcon from "../public/twitter.svg";
import Image from "next/image";

const TWITTER_CLIENT_ID = "T1dLaHdFSWVfTnEtQ2psZThTbnI6MTpjaQ" // give your twitter client id here

// twitter oauth Url constructor
function getTwitterOauthUrl() {
  const rootUrl = "https://twitter.com/i/oauth2/authorize";
  const options = {
    redirect_uri: "http://www.localhost:3001/oauth/twitter", // client url cannot be http://localhost:3000/ or http://127.0.0.1:3000/
    client_id: TWITTER_CLIENT_ID,
    state: "state",
    response_type: "code",
    code_challenge: "y_SfRG4BmOES02uqWeIkIgLQAlTBggyf_G7uKT51ku8",
    code_challenge_method: "S256",
    scope: ["users.read", "tweet.read", "follows.read", "follows.write"].join(" "), // add/remove scopes as needed
  };
  const qs = new URLSearchParams(options).toString();
  return `${rootUrl}?${qs}`;
}

// the component
export function TwitterOauthButton() {
  return (
    <a className="a-button row-container" href={getTwitterOauthUrl()}>
      <Image src={twitterIcon} alt="twitter icon" />
      <p>{" twitter"}</p>
    </a>
  );
}
```
> **Note**: We are hard coding `code_challenge` and `code_verifier` for simplicity. You can randomly generate it.

After adding the above code in `client\components\TwitterOauthButton.tsx`, we will add a twitter SVG icon (from online resources like [this](https://icons8.com/icons/set/twitter)) on path `client\public\twitter.svg`.
Then we will import the component on the homepage:
```ts
import { TwitterOauthButton } from "../components/TwitterOauthButton";

const Home: NextPage = () => {
  return (
    <div className="column-container">
      <p>Hello!</p>
      <TwitterOauthButton />
    </div>
  );
};
```
This is how it should look like afterwards:

![Webpage with Twitter icon and text, "Hello! twitter"](https://raw.githubusercontent.com/Reinforz/twitter-oauth2-blog/main/images/6.png)

Clicking on the Twitter icon will lead us to the Twitter page where we can authorize the app:

![Twitter interface asking whether to authorize app or cancel](https://raw.githubusercontent.com/Reinforz/twitter-oauth2-blog/main/images/6.5.png)

Of course, clicking on the `authorize app` button leads to a `Cannot GET /oauth/twitter` response, as we haven't implemented the backend yet.

#### Me query
Let's request for the current logged in user from the frontend through a hook, `client\hooks\useMeQuery.ts`:
```ts
import { useEffect, useState } from "react";
import axios, { AxiosResponse } from "axios";

export type User = {
  id: string;
  name: string;
  username: string;
  type: "local" | "twitter";
};

export function useMeQuery() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<User | null>(null);

  useEffect(() => {
    setLoading(true);
    axios
      .get<any, AxiosResponse<User>>(`http://www.localhost:3001/me`, {
        withCredentials: true,
      })
      .then((v) => {
        if (v.data) setData(v.data);
      })
      .catch(() => setError("Not Authenticated"))
      .finally(() => setLoading(false));
  }, []);

  return { error, data, loading };
}
```
This will do a good enough job for our minimal app. We will use it to determine what to render. We will render the username if we get a user from the hook. Otherwise, we will render the `Login with Twitter` button
```ts
import type { NextPage } from "next";
import { TwitterOauthButton } from "../components/TwitterOauthButton";
import { useMeQuery } from "../hooks/useMeQuery";

const Home: NextPage = () => {
  const { data: user } = useMeQuery();
  return (
    <div className="column-container">
      <p>Hello!</p>
      {user ? (// user present so only display user's name
        <p>{user.name}</p>
      ) : (// user not present so prompt to login
        <div>
          <p>You are not Logged in! Login with:</p>
          <TwitterOauthButton />
        </div>
      )}
    </div>
  );
};

export default Home;
```
The above is how the final `client\pages\index.tsx` will look like. Go to http://www.localhost:3000 and inspect the network window of the browser while the page is loading. You should see the Me query being executed there.

![Information about the query GET http://www.localhost:3001/me which failed with status 404](https://raw.githubusercontent.com/Reinforz/twitter-oauth2-blog/main/images/6.6.png)

> Its 404 because we havent implemented it in the backend

#### Styling

Let's just add some basic styling while we are at it by modifying the `client\styles\globals.css` file:
```css
html,
body {
  padding: 0;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
    Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
}

a {
  color: inherit;
  text-decoration: none;
}

.column-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.row-container {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
}

.a-button {
  border: 2px solid grey;
  border-radius: 5px;
}

.a-button:hover {
  background-color: #111133;
}

@media (prefers-color-scheme: dark) {
  html {
    color-scheme: dark;
  }
  body {
    color: white;
    background: black;
  }
}
```

That is all we have to do on our client-side. The final homepage should look like this:

![Webpage saying to log in by clicking on the below twitter logo button](https://raw.githubusercontent.com/Reinforz/twitter-oauth2-blog/main/images/7.png)


### Server

As we saw from our frontend, we need to implement `GET /oauth/twitter` route in our server to make the Twitter OAuth part of the app work. A look at the [twitter documentation](https://developer.twitter.com/en/docs/authentication/oauth-2-0/user-access-token) reveals the steps we need to perform so that we can read the info we mentioned in our scopes [here](#frontend-authentication-button).
These steps are summarized below:
1. getting the access token
2. getting the Twitter user from the access token
3. upsert the user in our database
4. create cookie so that the server can validate the user
5. redirect to the client with the cookie
   
> **Note**: Only the first two steps are related to Twitter OAuth Implementation

Lets add a file `server\src\oauth2.ts` where we will add our OAuth related codes. We will complete the steps above by defining a function there:
```ts
// the function which will be called when twitter redirects to the server at http://www.localhost:3001/oauth/twitter
export async function twitterOauth(req: Request<any, any, any, {code:string}>, res: Response) {
  const code = req.query.code; // getting the code if the user authorized the app

  // 1. get the access token with the code

  // 2. get the twitter user using the access token

  // 3. upsert the user in our db

  // 4. create cookie so that the server can validate the user

  // 5. finally redirect to the client

  return res.redirect(CLIENT_URL);
}
```

Before doing any of that make sure we the Twitter OAuth client secret in our `.env` file. We will also add a JWT secret there so that we can encrypt the cookie we send to the client. The final `.env` file should look like this:
```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/twitter-oauth2
CLIENT_URL=http://www.localhost:3000
SERVER_PORT=3001
JWT_SECRET=put-your-jwt-secret-here
TWITTER_CLIENT_SECRET=put-your-twitter-client-secret-here
```
#### Getting the access token with the code
Add the following code(the commented lines explain what they do) to get the access token:
```ts
// add your client id and secret here:
const TWITTER_OAUTH_CLIENT_ID = "T1dLaHdFSWVfTnEtQ2psZThTbnI6MTpjaQ";
const TWITTER_OAUTH_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET!;

// the url where we get the twitter access token from
const TWITTER_OAUTH_TOKEN_URL = "https://api.twitter.com/2/oauth2/token";

// we need to encrypt our twitter client id and secret here in base 64 (stated in twitter documentation)
const BasicAuthToken = Buffer.from(`${TWITTER_OAUTH_CLIENT_ID}:${TWITTER_OAUTH_CLIENT_SECRET}`, "utf8").toString(
  "base64"
);

// filling up the query parameters needed to request for getting the token
export const twitterOauthTokenParams = {
  client_id: TWITTER_OAUTH_CLIENT_ID,
  // based on code_challenge
  code_verifier: "8KxxO-RPl0bLSxX5AWwgdiFbMnry_VOKzFeIlVA7NoA",
  redirect_uri: `http://www.localhost:3001/oauth/twitter`,
  grant_type: "authorization_code",
};

// the shape of the object we should recieve from twitter in the request
type TwitterTokenResponse = {
  token_type: "bearer";
  expires_in: 7200;
  access_token: string;
  scope: string;
};

// the main step 1 function, getting the access token from twitter using the code that twitter sent us
export async function getTwitterOAuthToken(code: string) {
  try {
    // POST request to the token url to get the access token
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
```

#### Getting the Twitter User from access token
Similar code to get user from access token:
```ts
// the shape of the response we should get
export interface TwitterUser {
  id: string;
  name: string;
  username: string;
}

// getting the twitter user from access token
export async function getTwitterUser(accessToken: string): Promise<TwitterUser | null> {
  try {
    // request GET https://api.twitter.com/2/users/me
    const res = await axios.get<{ data: TwitterUser }>("https://api.twitter.com/2/users/me", {
      headers: {
        "Content-type": "application/json",
        // put the access token in the Authorization Bearer token
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return res.data.data ?? null;
  } catch (err) {
    console.error(err);

    return null;
  }
}
```

#### Checking if they work
Let's see if they successfully gets us the user. After adding all the code in the `server\src\oauth2.ts` file it should look like this:
```ts
import { CLIENT_URL } from "./config";
import axios from "axios";
import { Request, Response } from "express";

// add your client id and secret here:
const TWITTER_OAUTH_CLIENT_ID = "T1dLaHdFSWVfTnEtQ2psZThTbnI6MTpjaQ";
const TWITTER_OAUTH_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET!;

// the url where we get the twitter access token from
const TWITTER_OAUTH_TOKEN_URL = "https://api.twitter.com/2/oauth2/token";

// we need to encrypt our twitter client id and secret here in base 64 (stated in twitter documentation)
const BasicAuthToken = Buffer.from(`${TWITTER_OAUTH_CLIENT_ID}:${TWITTER_OAUTH_CLIENT_SECRET}`, "utf8").toString(
  "base64"
);

// filling up the query parameters needed to request for getting the token
export const twitterOauthTokenParams = {
  client_id: TWITTER_OAUTH_CLIENT_ID,
  code_verifier: "8KxxO-RPl0bLSxX5AWwgdiFbMnry_VOKzFeIlVA7NoA",
  redirect_uri: `http://www.localhost:3001/oauth/twitter`,
  grant_type: "authorization_code",
};

// the shape of the object we should recieve from twitter in the request
type TwitterTokenResponse = {
  token_type: "bearer";
  expires_in: 7200;
  access_token: string;
  scope: string;
};

// the main step 1 function, getting the access token from twitter using the code that the twitter sent us
export async function getTwitterOAuthToken(code: string) {
  try {
    // POST request to the token url to get the access token
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
    return null;
  }
}

// the shape of the response we should get
export interface TwitterUser {
  id: string;
  name: string;
  username: string;
}

// getting the twitter user from access token
export async function getTwitterUser(accessToken: string): Promise<TwitterUser | null> {
  try {
    // request GET https://api.twitter.com/2/users/me
    const res = await axios.get<{ data: TwitterUser }>("https://api.twitter.com/2/users/me", {
      headers: {
        "Content-type": "application/json",
        // put the access token in the Authorization Bearer token
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return res.data.data ?? null;
  } catch (err) {
    return null;
  }
}

// the function which will be called when twitter redirects to the server at http://www.localhost:3001/oauth/twitter
export async function twitterOauth(req: Request<any, any, any, {code:string}>, res: Response) {
  const code = req.query.code;

  // 1. get the access token with the code
  const TwitterOAuthToken = await getTwitterOAuthToken(code);
  console.log(TwitterOAuthToken);
  
  if (!TwitterOAuthToken) {
    // redirect if no auth token
    return res.redirect(CLIENT_URL);
  }
  
  // 2. get the twitter user using the access token
  const twitterUser = await getTwitterUser(TwitterOAuthToken.access_token);
  console.log(twitterUser);
  
  if (!twitterUser) {
    // redirect if no twitter user
    return res.redirect(CLIENT_URL);
  }
   
  // 3. upsert the user in our db
  
  // 4. create cookie so that the server can validate the user
  
  // 5. finally redirect to the client

  return res.redirect(CLIENT_URL);
}
```
Import and add the route to our express app:
```ts
app.get("/ping", (_, res) => res.json("pong"));

// activate twitterOauth function when visiting the route 
app.get("/oauth/twitter", twitterOauth);
app.listen(SERVER_PORT, () => console.log(`Server listening on port ${SERVER_PORT}`))
```
Now run the client and server, and look at the server console on what happens if we click on the Twitter button in the frontend and authorize the app.

![successfully fetching user and access token fron twitter](https://raw.githubusercontent.com/Reinforz/twitter-oauth2-blog/main/images/8.png)

We successfully got the user from Twitter now!
The most important part, i.e. getting the user from Twitter, is done. Now we can finish up our project.

## Finishing the web app
Let's finish up the rest of the steps needed for `GET /oauth/twitter` to work. Since they are not related to OAuth, I will add the functions in the `server\src\config.ts` file.

```ts
import { PrismaClient, User } from "@prisma/client"
import { CookieOptions, Response } from "express";
import { TwitterUser } from "./oauth2";
import jwt from "jsonwebtoken";

export const CLIENT_URL = process.env.CLIENT_URL!
export const SERVER_PORT = process.env.SERVER_PORT!
export const prisma = new PrismaClient()

// step 3
export function upsertUser(twitterUser: TwitterUser) {
  // create a new user in our database or return an old user who already signed up earlier 
  return prisma.user.upsert({
    create: {
      username: twitterUser.username,
      id: twitterUser.id,
      name: twitterUser.name,
      type: "twitter",
    },
    update: {
      id: twitterUser.id,
    },
    where: {  id: twitterUser.id},
  });
}

// JWT_SECRET from our environment variable file
export const JWT_SECRET = process.env.JWT_SECRET!

// cookie name
export const COOKIE_NAME = 'oauth2_token'

// cookie setting options
const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production'
  sameSite: "strict"
}

// step 4
export function addCookieToRes(res: Response, user: User, accessToken: string) {
  const { id, type } = user;
  const token = jwt.sign({ // Signing the token to send to client side
    id,
    accessToken,
    type
  }, JWT_SECRET);
  res.cookie(COOKIE_NAME, token, {  // adding the cookie to response here
    ...cookieOptions,
    expires: new Date(Date.now() + 7200 * 1000),
  });
}
```
Import the functions and use them in the `server\src\oauth2.ts`:
```ts
import { prisma, CLIENT_URL, addResCookie } from "./config";

...

// the function which will be called when twitter redirects to the server at http://www.localhost:3001/oauth/twitter
export async function twitterOauth(req: Request<any, any, any, {code:string}>, res: Response) {
  const code = req.query.code;

  // 1. get the access token with the code
  const twitterOAuthToken = await getTwitterOAuthToken(code);
  
  if (!twitterOAuthToken) {
    // redirect if no auth token
    return res.redirect(CLIENT_URL);
  }
  
  // 2. get the twitter user using the access token
  const twitterUser = await getTwitterUser(twitterOAuthToken.access_token);
  
  if (!twitterUser) {
    // redirect if no twitter user
    return res.redirect(CLIENT_URL);
  }
  
  
  // 3. upsert the user in our db
  const user = await upsertUser(twitterUser)
  
  // 4. create cookie so that the server can validate the user
  addCookieToRes(res, user, twitterOAuthToken.access_token)
  
  // 5. finally redirect to the client
  return res.redirect(CLIENT_URL);
}
```
> **Note**: We are sending the access token in the cookie for simplicity. For a web application, we should store it somewhere more secure, like a database.

And finally, add the `me` query in the `server\src\index.ts` file.

```ts
import { CLIENT_URL, COOKIE_NAME, JWT_SECRET, prisma, SERVER_PORT } from "./config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import jwt from 'jsonwebtoken'
import { getTwitterUser, twitterOauth } from "./oauth2";
import { User } from "@prisma/client";

const app = express();
const origin= [CLIENT_URL];
app.use(cookieParser());
app.use(cors({
  origin,
  credentials: true
}))
app.get("/ping", (_, res) => res.json("pong"));

type UserJWTPayload = Pick<User, 'id'|'type'> & {accessToken: string}

app.get('/me', async (req, res)=>{
  try {
    const token = req.cookies[COOKIE_NAME];
    if (!token) {
      throw new Error("Not Authenticated");
    }
    const payload = await jwt.verify(token, JWT_SECRET) as UserJWTPayload;
    const userFromDb = await prisma.user.findUnique({
      where: { id: payload?.id },
    });
    if (!userFromDb) throw new Error("Not Authenticated");
    if (userFromDb.type === "twitter") {
      if (!payload.accessToken) {
        throw new Error("Not Authenticated");
      }
      const twUser = await getTwitterUser(payload.accessToken);
      if (twUser?.id !== userFromDb.id) {
        throw new Error("Not Authenticated");
      }
    }
    res.json(userFromDb)
  } catch (err) {
    res.status(401).json("Not Authenticated")
  }
})

// activate twitterOauth function when visiting the route 
app.get("/oauth/twitter", twitterOauth);
app.listen(SERVER_PORT, () => console.log(`Server listening on port ${SERVER_PORT}`))
```
It is done now! Let's see what happens when we click the Twitter button on our client and authorize the app there.

![Successful login and setting up cookies in FE](https://raw.githubusercontent.com/Reinforz/twitter-oauth2-blog/main/images/9.png)

We see our Twitter username in there instead of the Twitter button now, which shows that the `me` query is being executed successfully. As a result, we now have a working user authentication system, via Twitter OAuth 2.0, in our minimal full-stack web application. 

## Conclusion
Thanks for reading! [This](https://github.com/Reinforz/twitter-oauth2-blog) is the Github repository with all the codes. Find more fun things you can do with the Twitter API [here](https://developer.twitter.com/en/docs/api-reference-index). Another example implementation of authentication via Twitter OAuth 2.0 can be found [here](https://github.com/imoxto/imodit).


*Written by [Rafid Hamid](https://github.com/imoxto)*