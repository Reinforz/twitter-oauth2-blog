import { authenticate, CLIENT_URL, SERVER_PORT } from "./config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { twitterOauth } from "./oauth2";
import fs from 'fs'
import https from 'https'

const app = express();

const origin = [CLIENT_URL];

app.use(cookieParser());
app.use(cors({
  origin,
  credentials: true
}))

app.get("/ping", (_, res) => res.json("pong"));

app.get("/oauth/twitter", twitterOauth);

app.get("/me", async (req, res)=> {
  try {
    const user = await authenticate(req)
    res.status(200).json(user)
  } catch (err) {
    res.status(401).json(null)
  }
});

// app.listen(SERVER_PORT, () => console.log(`Server listening on port ${SERVER_PORT}`))

const options = {
  key: fs.readFileSync("../localhost-key.pem"),
  cert: fs.readFileSync("../localhost.pem"),
};
const server = https.createServer(options, app);
server.listen(SERVER_PORT, () => console.log(`Server listening on port ${SERVER_PORT}`));
