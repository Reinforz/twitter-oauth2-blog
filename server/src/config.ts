import { PrismaClient, User, Prisma } from "@prisma/client";
import { CookieOptions, Response, Request } from "express";
import jwt from 'jsonwebtoken'
import { getTwitterUser } from "./oauth2";

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
};

const durationInS = 7 * 24 * 60 * 60;

const COOKIE_NAME = "twitter.oauth.min";

const JWT_SECRET = process.env.JWT_SECRET!

export const CLIENT_URL = process.env.CLIENT_URL!
export const SERVER_PORT = process.env.SERVER_PORT!

export const prisma = new PrismaClient()

export async function CreateUser(payload: Prisma.UserCreateInput) {
  return await prisma.user.create({
    data: payload
  })
}

export function signToken<Payload extends Record<string, any>>(payload: Payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: durationInS,
  });
}

export type UserJWTPayload = Pick<User, 'id'|'username'|'type'> & {accessToken?: string}

export function addResCookie({
  res,
  user,
  remember = true,
  accessToken,
  duration,
}: {
  res: Response;
  user: User;
  remember?: boolean;
  accessToken?: string;
  duration?: number;
}) {
  const { id, username, type } = user;
  const token = signToken<UserJWTPayload>({
    id,
    username,
    accessToken,
    type
  });
  res.cookie(COOKIE_NAME, token, {
    ...cookieOptions,
    expires: remember ? new Date(Date.now() + (duration ?? durationInS) * 1000) : undefined,
  });
}

export function removeResCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, cookieOptions);
}

export function getJwtPayloadFromReq(req: Request) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) {
    throw new Error("Not Authenticated");
  }
  return jwt.verify(token, JWT_SECRET) as Promise<UserJWTPayload>;
}

export async function checkUser(user: User | null, accessToken: string | undefined) {
  if (!user) throw new Error("Not Authenticated");
  if (user.type === "twitter") {
    if (!accessToken) {
      throw new Error("Not Authenticated");
    }
    const twUser = await getTwitterUser(accessToken);
    if (twUser?.id !== user.id) {
      throw new Error("Not Authenticated");
    }
  }
  return user;
}

export async function authenticate(req: Request) {
  const { id, accessToken } = await getJwtPayloadFromReq(req);
  const userFromDb = await prisma.user.findUnique({
    where: { id },
  });
  return await checkUser(userFromDb, accessToken);
}