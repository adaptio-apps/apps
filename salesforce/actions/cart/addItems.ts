import { AppContext } from "../../mod.ts";
import type { Basket, BasketItems } from "../../utils/types.ts";
import { proxySetCookie } from "../../utils/cookies.ts";
import { getCookies } from "std/http/mod.ts";
import getBasketImages from "../../utils/product.ts";
import { getHeaders } from "../../utils/transform.ts";

export interface Props {
  basketItems: BasketItems[];
}
const action = async (
  props: Props,
  req: Request,
  ctx: AppContext,
): Promise<Basket> => {
  const { slc, organizationId, siteId } = ctx;
  const {
    basketItems,
  } = props;
  console.log(props);

  const cookies = getCookies(req.headers);
  const token = cookies[`token_${siteId}`];
  const basketId = cookies[`basket_${siteId}`];
  console.log(token);

  try {
    const response = await slc
      ["POST /checkout/shopper-baskets/v1/organizations/:organizationId/baskets/:basketId/items"](
        {
          organizationId,
          basketId,
          siteId,
        },
        {
          body: basketItems,
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
