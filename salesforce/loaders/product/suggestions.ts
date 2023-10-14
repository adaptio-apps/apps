import { AppContext } from "../../mod.ts";
import type { Suggestion } from "../../../commerce/types.ts";
import {
  toProductSuggestions,
  toSearchSuggestions,
} from "../../utils/transform.ts";
import { getSession, getSessionHeaders } from "../../utils/session.ts";

/**
 * @title Salesforce - suggestions
 */
export interface Props {
  /**
   * @title Query
   * @description Keyphase of the collection.
   */
  query?: string;

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
): Promise<Suggestion | null> {
  const { slc, organizationId, siteId } = ctx;

  const session = getSession(ctx);
  console.log("s");

  const url = new URL(req.url);
  const { limit } = props;
  const query = props.query ?? url.searchParams.get("query") ?? "";
  const response = await slc
    ["GET /search/shopper-search/v1/organizations/:organizationId/search-suggestions"](
      {
        organizationId,
        siteId: siteId,
        q: query,
        limit: limit,
      },
      {
        headers: getSessionHeaders(session),
      },
    );

  const suggestions = await response.json();

  const products = toProductSuggestions(
    suggestions.productSuggestions,
    url.origin,
  );
  const searches = toSearchSuggestions(
    suggestions.searchPhrase,
    suggestions.productSuggestions,
    products.length,
  );
  return { searches, products };
}
