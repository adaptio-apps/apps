import {
  PricingRange,
  ProductSearch,
  RefineParams,
} from "../../utils/types.ts";
import { AppContext } from "../../mod.ts";
import { paths } from "../../utils/paths.ts";
import { fetchAPI } from "../../../utils/fetch.ts";
import type { Product } from "../../../commerce/types.ts";
import { toProductList } from "../../utils/transform.ts";
import { toPriceRange, toRefineParams } from "../../utils/utils.ts";
import { getCookies } from "std/http/mod.ts";

/**
 * @title Salesforce - Product List
 */
export interface Props {
  /**
   * @title Query
   * @description Keyphase of the collection.
   */
  q?: string;

  /**
   * @title Category ID.
   * @description Sort the categories and subcategories according to those created in the sales force. Example: men, clothes, suits
   */
  categoryID?: Array<string>;

  /**
   * @title Promotion ID.
   * @description Allows refinement per promotion ID.
   */
  pmid?: string;

  /**
   * @description Allows refinement per single price range. Multiple price ranges are not supported.
   */
  price?: PricingRange;

  /**
   * @title Extra Params.
   * @description Define extra refinement params to the query. DO NOT EXCEED 5 EXTRA PARAMS.
   * @max 5
   */
  extraParams: RefineParams[];

  /**
   * @title Sort.
   */
  sort?: Sort;

  /**
   * @description Maximum records to retrieve per request, not to exceed 50. Defaults to 25.
   * @default 10
   * @max 50
   */
  limit: number;
}

export type Sort =
  | "price-high-to-low"
  | "price-low-to-high"
  | "product-name-ascending"
  | "product-name-descending"
  | "brand"
  | "most-popular"
  | "top-sellers"
  | "";

/**
 * @title Salesforce - Product List
 */
export default async function loader(
  props: Props,
  req: Request,
  ctx: AppContext,
): Promise<Product[] | null> {
  const { siteId } = ctx;
  
  const cookies = getCookies(req.headers);
  const token = cookies[`token_${siteId}`];
  console.log(cookies);
  console.log(token);
  const url = new URL(req.url);
  const { categoryID, pmid, sort, limit, q, price } = props;
  const refineParams = toRefineParams(props.extraParams);
  const getProductBySlug = await fetchProducts<ProductSearch>(
    paths(
      ctx,
    ).search.shopper_search.v1.organizations._organizationId.product_search.q(
      q,
      {
        sort,
        limit,
        refine_cgid: categoryID?.join("-"),
        refine_pmid: pmid,
        refine_htype: "master|product",
        refine_price: toPriceRange(price),
        ...refineParams,
      },
    ),
    token,
  );

  if (getProductBySlug.total == 0) return null;

  return toProductList(getProductBySlug, url.origin);
}

const fetchProducts = <T>(path: string, token: string): Promise<T> => {
  return fetchAPI<T>(path, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
