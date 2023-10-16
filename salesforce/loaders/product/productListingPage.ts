// deno-lint-ignore-file no-explicit-any
import {
  CategorySalesforce,
  PricingRange,
  RefineParams,
  Sort,
} from "../../utils/types.ts";
import { AppContext } from "../../mod.ts";
import type { ProductListingPage, Seo } from "../../../commerce/types.ts";
import {
  filtersFromURL,
  toFilters,
  toProductHit,
} from "../../utils/transform.ts";
import { getSession } from "../../utils/session.ts";
import getProducts from "../../utils/getProducts.ts";

import getCategories from "../../utils/getCategories.ts";

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
  addictionalInformationAllowed: boolean;
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
  const { addictionalInformationAllowed } = props;

  const url = new URL(req.url);
  const {
    query,
    page,
    sort,
    limit,
    offset,
  } = searchArgsOf(props, url);

  const refine: string[] = [];

  const categoryName = url.pathname.split("/");
  const seo: Seo = {
    title: "",
    description: "",
    canonical: "",
  };
  if (categoryName) {
    const categorySearchText = categoryName.filter((str) => str !== "").join(
      "-",
    );

    let categorySearch: CategorySalesforce | null;
    if (categorySearchText) {
      categorySearch = await (getCategories({ id: categorySearchText }, ctx));
      const selectedCategory = categorySearch?.categories?.find((
        cat: { id: string },
      ) => cat.id = categorySearchText);
      if (selectedCategory) {
        refine.push(`cgid=${selectedCategory?.id}&`);
        seo.title = selectedCategory.pageTitle;
        seo.description = selectedCategory.pageDescription;
        seo.canonical = req.url;
      }
    }
  }

  const refinements = filtersFromURL(url);

  refinements.map((ref) => {
    refine.push(`${ref.key}=${ref.value}&`);
  });

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
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      },
    );

  const searchResult = await response.json();

  const ids = searchResult.hits?.map((items) => items.productId.toString());
  let addictionalInformation: any;

  if (addictionalInformationAllowed) {
    addictionalInformation = await getProducts(
      {
        ids: ids,
        select:
          "(data.(name,productId,id,primaryCategoryId,pageDescription,brand,imageGroups,variants.(**)))",
      },
      ctx,
    );
  }
  const products = searchResult.hits?.map((items) =>
    toProductHit(
      items,
      url.origin,
      addictionalInformation?.data?.find((item: { id: string }) =>
        item.id == items.productId
      ),
    )
  );

  const sortOptions = searchResult.sortingOptions.map((sort) => ({
    value: sort.id,
    label: sort.label,
  }));

  const currentFilters = filtersFromURL(url);
  const filters = toFilters(
    searchResult.refinements,
    currentFilters,
    url,
  );

  console.log(filters);

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
    sortOptions: sortOptions,
    seo: seo,
  };
}