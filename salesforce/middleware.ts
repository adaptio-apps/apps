import { AppMiddlewareContext } from "./mod.ts";
import { getCookies } from "std/http/mod.ts";
import authApi from "./utils/auth.ts";
import { setTokenCookie } from "./utils/cookies.ts";

export const middleware = async (
  _props: unknown,
  req: Request,
  ctx: AppMiddlewareContext,
) => {
  const cookies = getCookies(req.headers);
  const siteId = String(ctx?.siteId);
  if (`token_${siteId}` in cookies || !ctx) {
    return ctx.next!();
  }

  const cc_nxCookie = cookies[`cc-nx_${siteId}`];
  const cc_nx_gCookie = cookies[`cc-nx-g_${siteId}`];
  if (cc_nxCookie || cc_nx_gCookie) {
    const refreshToken = cc_nxCookie ?? cc_nx_gCookie;
    const token = await authApi({
      grantType: "refresh_token",
      refreshToken,
    }, ctx);
    if (token) {
      setTokenCookie(token, ctx.response, siteId);
    }
  }
  const token = await authApi({ grantType: "client_credentials" }, ctx);
  if (token) {
    setTokenCookie(token, ctx.response, siteId);
  }
  return await ctx.next!();
};
