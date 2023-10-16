import { AppContext } from "../../mod.ts";
import { paths } from "../../utils/paths.ts";
import { ProductBaseSalesforce, ProductSearch } from "../../utils/types.ts";
import { fetchAPI } from "../../../utils/fetch.ts";
import { toProductPage } from "../../utils/transform.ts";
import type { ProductDetailsPage } from "../../../commerce/types.ts";
import type { RequestURLParam } from "../../../website/functions/requestToParam.ts";
import { getSession } from "../../utils/session.ts";

export interface Props {
  slug: RequestURLParam;
  id: RequestURLParam;
}

/**
 * @title Salesforce Product Details Page
 * @description works on routes /:slug/p?id=optionalProductId
 */
export default async function loader(
  props: Props,
  req: Request,
  ctx: AppContext,
): Promise<ProductDetailsPage | null> {
  const url = new URL(req.url);
  const session = getSession(ctx);

  const { slug, id } = props;

  if (!slug) return null;

  if (!id) {
    const getProductBySlug = await fetchProduct<ProductSearch>(
      paths(
        ctx,
      ).search.shopper_search.v1.organizations._organizationId.product_search.q(
        slug.replace(/-/g, " "),
        {
          limit: 1,
          refine_htype: "master",
        },
      ),
      session.token!,
    );

    if (getProductBySlug.limit == 0) return null;

    const getProductById = await fetchProduct<ProductBaseSalesforce>(
      paths(
        ctx,
      ).product.shopper_products.v1.organizations._organizationId.products
        .productId(
          getProductBySlug.hits[0].productId,
        ),
      session.token!,
    );

    return {
      ...toProductPage(getProductById, url.origin),
    };
  }

  const getProductById = await fetchProduct<ProductBaseSalesforce>(
    paths(
      ctx,
    ).product.shopper_products.v1.organizations._organizationId.products
      .productId(
        id,
        { allImages: true },
      ),
    session.token!,
  );

  const variantId = url.searchParams.get("skuId") ?? "";

  const newProduct = toProductPage(getProductById, url.origin, variantId);

  return newProduct;
}

const fetchProduct = <T>(path: string, token: string) => {
  return fetchAPI<T>(path, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
};