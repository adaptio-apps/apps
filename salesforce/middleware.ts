import { AppMiddlewareContext } from "./mod.ts";
import { getCookies } from "std/http/mod.ts";
import authApi from "./utils/auth.ts";
import { setBasketCookie, setTokenCookie } from "./utils/cookies.ts";
import createCart from "./utils/createCart.ts";

export const middleware = async (
  _props: unknown,
  req: Request,
  ctx: AppMiddlewareContext,
) => {
  const cookies = getCookies(req.headers);
  const siteId = String(ctx?.siteId);

  const handleAuthAndBasket = async (
    grantType: string,
    refreshToken?: string,
  ) => {
    const token = await authApi({ grantType, refreshToken }, ctx);
    if (token) {
      const basket = await createCart(token.access_token, ctx);
      if (basket) {
        await setTokenCookie(token, ctx.response, siteId);
        setBasketCookie(basket, ctx.response, siteId);
      }
    }
  };

  if (`token_${siteId}` in cookies || !ctx) {
    if (!(`basket_${siteId}` in cookies) || !ctx) {
      const basket = await createCart(`token_${siteId}`, ctx);
      if (basket) {
        setBasketCookie(basket, ctx.response, siteId);
      }
    }
  } else {
    const cc_nxCookie = cookies[`cc-nx_${siteId}`];
    const cc_nx_gCookie = cookies[`cc-nx-g_${siteId}`];
    const refreshToken = cc_nxCookie || cc_nx_gCookie;

    if (refreshToken) {
      await handleAuthAndBasket("refresh_token", refreshToken);
    } else {
      await handleAuthAndBasket("client_credentials");
    }
  }

  return await ctx.next!();
};
