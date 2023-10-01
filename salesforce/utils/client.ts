import { OrderForm } from "./types.ts";

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
}
