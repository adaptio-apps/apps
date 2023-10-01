/* import { Runtime } from "deco-sites/std/runtime.ts"; */
import { OrderForm } from "../utils/types.ts";
import { state as storeState } from "./context.ts";
import { AnalyticsItem } from "../../commerce/types.ts";

const { cart, loading } = storeState;

export const mapOrderFormItemsToAnalyticsItems = (
  orderForm: Pick<OrderForm, "productItems" | "couponItems">
): AnalyticsItem[] => {
  const { productItems, couponItems } = orderForm;

  if (!productItems) {
    return [];
  }

  return productItems.map((item, index) => ({
    item_id: item.productId,
    item_name: item.productName ?? item.itemText ?? "",
    coupon: couponItems?.map((item) => item.code).join("&"),
    discount: Number(item.price - item.priceAfterItemDiscount),
    index,
    item_variant: item.productName ?? item.itemText ?? "",
    price: item.price,
    quantity: item.quantity,
    affiliation: "Salesforce",
  }));
};

export const itemToAnalyticsItem = (
  item: OrderForm["productItems"][number],
  index: number,
  couponItems?: OrderForm["couponItems"]
) => ({
  item_id: item.productId,
  item_name: item.productName ?? item.itemText ?? "",
  coupon: couponItems?.map((item) => item.code).join(",") ?? "",
  discount: Number(item.price - item.priceAfterItemDiscount),
  index,
  item_variant: item.productName ?? item.itemText ?? "",
  price: item.price,
  quantity: item.quantity,
  affiliation: "Salesforce",
});

// deno-lint-ignore no-unused-vars
const wrap =
  <T>(action: (p: T, init?: RequestInit | undefined) => Promise<OrderForm>) =>
  (p: T) =>
    storeState.enqueue(async (signal) => ({
      cart: await action(p, { signal }),
    }));

const state = {
  cart,
  loading,
  /*
  TODO: Create actions on the card
  updateItems: wrap(
    Runtime.create("deco-sites/std/actions/vtex/cart/updateItems.ts"),
  ), */
  mapItemsToAnalyticsItems: mapOrderFormItemsToAnalyticsItems,
};

export const useCart = () => state;
