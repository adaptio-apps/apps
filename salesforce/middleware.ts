import { AppMiddlewareContext } from "./mod.ts";
import { getCookies } from "std/http/mod.ts";
import authApi from "./utils/auth.ts";
import createCart from "./utils/createCart.ts";
import {
  getSessionCookie,
  setSession,
  setSessionCookie,
} from "./utils/session.ts";

const ONCE = Symbol("once");
const handleAuthAndBasket = async (
  ctx: AppMiddlewareContext,
  grantType: string,
  refreshToken?: string,
) => {
  const token = await authApi({ grantType, refreshToken }, ctx);
  if (token) {
    const basket = await createCart(token.access_token, ctx);
    if (basket) {
      const session = {
        token: token.access_token,
        basketId: basket.basketId,
      };

      setSessionCookie(
        session,
        token,
        ctx.response.headers,
      );
    }
  }
};
export const middleware = async (
  _props: unknown,
  req: Request,
  ctx: AppMiddlewareContext,
) => {
  console.log(ctx.bag.has(ONCE));
  if (!ctx.bag.has(ONCE)) {
    ctx.bag.set(ONCE, true);
  }

  const { siteId } = ctx;

  const cookies = getCookies(req.headers);

  const cc_nxCookie = cookies[`cc-nx_${siteId}`];
  const cc_nx_gCookie = cookies[`cc-nx-g_${siteId}`];
  const refreshToken = cc_nxCookie || cc_nx_gCookie;

  const session = getSessionCookie(req);

  if (!session.token && refreshToken) {
    await handleAuthAndBasket(ctx, "refresh_token", refreshToken);
  }
  if (!session.token) {
    await handleAuthAndBasket(ctx, "client_credentials");
  }
  setSession(ctx, session);

  return await ctx.next!();
};
