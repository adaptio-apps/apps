import { getSetCookies, setCookie } from "std/http/cookie.ts";
import { TokenBaseSalesforce } from "./types.ts";
import { convertSecondsToDate } from "./utils.ts";
import { AppContext } from "../mod.ts";
import { getCookies } from "std/http/mod.ts";

export const stringify = (cookies: Record<string, string>) =>
  Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");

export const proxySetCookie = (
  from: Headers,
  to: Headers,
  toDomain?: URL | string,
) => {
  const newDomain = toDomain && new URL(toDomain);

  for (const cookie of getSetCookies(from)) {
    const newCookie = newDomain
      ? {
        ...cookie,
        domain: newDomain.hostname,
      }
      : cookie;

    setCookie(to, newCookie);
  }
};

export const setTokenCookie = (
  token: TokenBaseSalesforce,
  res: { headers: Headers },
  siteId: string,
) => {
  const {
    access_token,
    expires_in,
    refresh_token,
    usid,
    refresh_token_expires_in,
    id_token,
  } = token;

  const expireTokenDate = convertSecondsToDate(expires_in)
    .toUTCString();
  const expireRefTokenDate = convertSecondsToDate(refresh_token_expires_in)
    .toUTCString();

  res.headers.set(
    "Set-Cookie",
    `token_${siteId}=${access_token}; Expires=${expireTokenDate}; Secure=true; HttpOnly:true`,
  );

  res.headers.append(
    "Set-Cookie",
    `${
      id_token ? "cc-nx" : "cc-nx-g"
    }_${siteId}=${refresh_token}; Expires=${expireRefTokenDate}; Secure=true; HttpOnly:true`,
  );

  res.headers.append(
    "Set-Cookie",
    `usid_${siteId}=${usid}; Secure=true; HttpOnly:true`,
  );
};

export const getTokenCookie = (
  req: Request,
  ctx: AppContext,
) => {
  const cookies = getCookies(req.headers);
  const { siteId } = ctx;
  return cookies[`token_${siteId}`];
};
