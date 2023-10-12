import { AppContext } from "../../mod.ts";
import type { Product } from "../../../commerce/types.ts";
import { getHeaders, toProductList } from "../../utils/transform.ts";
import { getCookies } from "std/http/mod.ts";

/**
 * @title Salesforce - suggestions
 */
export interface Props {
  /**
   * @title Query
   * @description Keyphase of the collection.
   */
  q?: string;

  /**
   * @description Maximum records to retrieve per request, not to exceed 50. Defaults to 25.
   * @default 10
   * @max 50
   */
  limit: number;
}

/**
 * @title Salesforce - suggestions
 */
export default async function loader(
  props: Props,
  req: Request,
  ctx: AppContext,
): Promise<Product[] | null> {
  const { slc, organizationId, siteId } = ctx;

  const cookies = getCookies(req.headers);
  const token = cookies[`token_${siteId}`];

  const url = new URL(req.url);
  const { limit, q } = props;

  const response = await slc
    ["GET /search/shopper-search/v1/organizations/:organizationId/search-suggestions"](
      {
        organizationId,
        siteId: siteId,
        q: q,
        limit: limit,
      },
      {
        headers: getHeaders(token),
      },
    );

  const getProductByCategory = await response.json();

  return toProductList(getProductByCategory, url.origin);
}
