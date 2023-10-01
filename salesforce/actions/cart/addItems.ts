import { AppContext } from "../../mod.ts";
import type { OrderForm } from "../../utils/types.ts";
import { getCookies } from "std/http/mod.ts";

export interface Item {
  productId: string;
  quantity: number;
}

export interface Props {
  orderItems: Item[];
}
const action = async (
  props: Props,
  req: Request,
  ctx: AppContext,
): Promise<OrderForm> => {
  const { slc, organizationId } = ctx;
  const {
    orderItems,
  } = props;
  const { cookie, basketId } = getCookies(req.headers);
  try {
    const response = await slc
      ["POST /checkout/shopper-baskets/v1/organizations/:organizationId/baskets/:basketId/items"](
        {
          organizationId,
          basketId,
        },
        {
          body: { orderItems },
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
