import { AppContext } from "../../mod.ts";
import type { OrderForm } from "../../utils/types.ts";
import { getCookies } from "std/http/mod.ts";

export interface Props {
  quantity: number;
}
const action = async (
  props: Props,
  req: Request,
  ctx: AppContext,
): Promise<OrderForm> => {
  const { slc, organizationId } = ctx;
  const { cookie, basketId, itemId } = getCookies(req.headers);
  try {
    const response = await slc
      ["PATCH /checkout/shopper-baskets/v1/organizations/:organizationId/baskets/:basketId/items/:itemId"](
        {
          organizationId,
          basketId,
          itemId,
        },
        {
          body: props,
          headers: {
            "content-type": "application/json",
            accept: "application/json",
            cookie,
          },
        },
      );

    // proxySetCookie(response.headers, ctx.response.headers, req.url);

    return response.json();
  } catch (error) {
    console.error(error);

    throw error;
  }
};

export default action;
