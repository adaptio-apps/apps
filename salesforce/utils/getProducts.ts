import { AppContext } from "../mod.ts";
import { getCookies } from "std/http/mod.ts";
import { ProductSearch } from "./types.ts";

export interface Props {
  ids: string[];
  select: string;
}

export default async function getProducts(
  props: Props,
  req: Request,
  ctx: AppContext,
): Promise<null | ProductSearch> {
  const { slc, organizationId, siteId } = ctx;

  const cookies = getCookies(req.headers);
  const token = cookies[`token_${siteId}`];

  const headers = new Headers({
    Authorization: `Bearer ${token}`,
  });

  const { select, ids } = props;
  let id = "";

  if (ids) {
    id = props.ids.join(",");
  }

  const response = await slc
    ["GET /product/shopper-products/v1/organizations/:organizationId/products"](
      {
        organizationId,
        siteId: siteId,
        ids: id,
        select: select,
      },
      { headers: headers },
    );

  const productSearchResult = await response.json();
  console.log(JSON.stringify(productSearchResult));

  return productSearchResult;
}
