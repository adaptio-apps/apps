import { getCookies, setCookie } from "std/http/mod.ts";
import type { Segment } from "./types.ts";

export const SEGMENT_COOKIE_NAME = "salesforce_segment";

export const SEGMENT = Symbol("segment");

/**
 * Stable serialization.
 *
 * This means that even if the attributes are in a different order, the final segment
 * value will be the same. This improves cache hits
 */
export const serialize = ({
  token,
  basketId,
  refresh_token,
  itemId,
}: Partial<Segment>) =>
  btoa(JSON.stringify({
    token,
    basketId,
    refresh_token,
    itemId,
  }));

export const parse = (cookie: string) => JSON.parse(atob(cookie));

export const getSegment = (req: Request): Partial<Segment> => {
  const cookies = getCookies(req.headers);
  const cookie = cookies[SEGMENT_COOKIE_NAME];
  const partial = cookie && parse(cookie);

  return {
    ...partial,
  };
};

export const setSegment = (
  segment: Partial<Segment>,
  headers: Headers = new Headers(),
): Headers => {
  setCookie(headers, {
    value: serialize(segment),
    name: SEGMENT_COOKIE_NAME,
    path: "/",
    secure: true,
    httpOnly: true,
  });

  return headers;
};

export const withSegmentCookie = (
  segment: Partial<Segment>,
  headers?: Headers,
) => {
  const h = new Headers(headers);

  h.set("cookie", `${SEGMENT_COOKIE_NAME}=${serialize(segment)}`);

  return h;
};
