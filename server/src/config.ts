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