import { AppContext } from "../../mod.ts";
import type { Basket } from "../../utils/types.ts";
import { getCookies } from "std/http/mod.ts";
import { proxySetCookie } from "../../utils/cookies.ts";
import getBasketImages from "../../utils/product.ts";
import { getHeaders } from "../../utils/transform.ts";

export interface Props {
  basketId: string;
  couponItemId: string;
}
const action = async (
  props: Props,
  req: Request,
  ctx: AppContext,
): Promise<Basket> => {
  const { slc, organizationId, siteId } = ctx;
  const cookies = getCookies(req.headers);
  const token = cookies[`token_${siteId}`];
  const basketId = cookies[`basket_${siteId}`];
  const { couponItemId } = props;


  try {
    const response = await slc
      ["DELETE /checkout/shopper-baskets/v1/organizations/:organizationId/baskets/:basketId/coupons/:couponItemId"](
        {
          organizationId,
          basketId,
          couponItemId,
        },
        {
          headers: getHeaders(token),
        },
      );

    const basket = await response.json();

    const productsBasketSku: string[] = basket.productItems.map(
      (item: { productId: string }) => {
        return item.productId;
      },
    );
    proxySetCookie(response.headers, ctx.response.headers, req.url);

    return await getBasketImages(basket, productsBasketSku, req, ctx);
  } catch (error) {
    console.error(error);

    throw error;
  }
};

export default action;
