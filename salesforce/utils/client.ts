import { OrderForm, TokenBaseSalesforce } from "./types.ts";

export interface SalesforceClient {
  "POST /checkout/shopper-baskets/v1/organizations/:organizationId/baskets/:basketId/items":
    {
      response: OrderForm;
      body: {
        orderItems: Array<{
          productId: string;
          quantity: number;
        }>;
      };
    };
  "PATCH /checkout/shopper-baskets/v1/organizations/:organizationId/baskets/:basketId/items/:itemId":
    {
      response: OrderForm;
      body: {
        quantity: number;
      };
    };
  "POST /shopper/auth/v1/organizations/:organizationId/oauth2/token": {
    response: TokenBaseSalesforce;
    body: {
      grant_type?: string;
      refresh_token?: string;
    };
    headers: {
      Authorization: string;
      ["content-type"]: "application/x-www-form-urlencoded";
    };
  };
  "GET search/shopper-search/v1/organizations/:organizationId/product-search": {
    response: OrderForm;
    searchParams: {
      siteId?: string;
      refine?: string;
      q?: string;
      sort?: string;
      limit?: number;
    };
    body: {
      orderItems: Array<{
        productId: string;
        quantity: number;
      }>;
    };
  };
}
