import { PricingRange, RefineParams, Sort } from "../../utils/types.ts";
import { AppContext } from "../../mod.ts";
import type { ProductListingPage } from "../../../commerce/types.ts";
import {
  filtersFromURL,
  toFilters,
  toProductHit,
} from "../../utils/transform.ts";
import { getSession, getSessionHeaders } from "../../utils/session.ts";
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
  categoryID?: string[];

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
  extraParams?: RefineParams[];

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
  page?: number;
}

const sortOptions = [
  { value: "", label: "relevance:desc" },
  { value: "price:desc", label: "price:desc" },
  { value: "price:asc", label: "price:asc" },
  { value: "orders:desc", label: "orders:desc" },
  { value: "name:desc", label: "name:desc" },
  { value: "name:asc", label: "name:asc" },
  { value: "release:desc", label: "release:desc" },
  { value: "discount:desc", label: "discount:desc" },
];

const searchArgsOf = (props: Props, url: URL) => {
  const limit = props.limit ?? 12;
  const query = props.q ?? url.searchParams.get("q") ?? "";
  const currentPageoffset = 1;
  const page = props.page ??
      url.searchParams.get("page")
    ? Number(url.searchParams.get("page")) - currentPageoffset
    : 0;
  const offset = page * limit;

  const sort = (url.searchParams.get("sort") as Sort) ??
    props.sort ??
    sortOptions[0].value;

  return {
    query,
    page,
    sort,
    limit,
    offset,
  };
};

/**
 * @title Salesforce - Product List
 */
export default async function loader(
  props: Props,
  req: Request,
  ctx: AppContext,
): Promise<ProductListingPage | null> {
  const { slc, organizationId, siteId } = ctx;

  const session = getSession(ctx);

  const url = new URL(req.url);
  const {
    query,
    page,
    sort,
    limit,
    offset,
  } = searchArgsOf(props, url);

  const refine: string[] = [];

  const refinements = filtersFromURL(url);

  refinements.map((ref) => {
    refine.push(`${ref.key}=${ref.value}&`);
  });

  console.log("refine", refine);
  const response = await slc
    ["GET /search/shopper-search/v1/organizations/:organizationId/product-search"](
      {
        organizationId,
        siteId,
        refine: refine,
        q: query,
        sort,
        limit,
        offset,
      },
      {
        headers: getSessionHeaders(session),
      },
    );

  const searchResult = await response.json();

  console.log("searchResult", searchResult);

  const products = searchResult.hits?.map((items) =>
    toProductHit(items, url.origin)
  );

  console.log(refinements);

  const currentFilters = url.searchParams.get("filter")?.split("/") ?? [];

  console.log("currentFilters", currentFilters);

  const filters = toFilters(
    searchResult.refinements,
    currentFilters,
    url,
  );

  const hasNextPage = (offset + limit) < searchResult.total;
  const hasPreviousPage = offset > 0;
  const nextPage = new URLSearchParams(url.searchParams);
  const previousPage = new URLSearchParams(url.searchParams);

  if (hasNextPage) {
    nextPage.set("page", (page + 2).toString());
  }

  if (hasPreviousPage) {
    previousPage.set("page", page.toString());
  }

  return {
    "@type": "ProductListingPage",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [],
      numberOfItems: 0,
    },
    filters: filters ?? [],
    products: products ?? [],
    pageInfo: {
      nextPage: hasNextPage ? `?${nextPage.toString()}` : undefined,
      previousPage: hasPreviousPage ? `?${previousPage.toString()}` : undefined,
      currentPage: page,
    },
    sortOptions: [],
  };
}
