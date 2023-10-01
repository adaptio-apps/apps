// deno-lint-ignore-file no-explicit-any
/* import { Runtime } from "deco-sites/std/runtime.ts"; */
import { OrderForm } from "../utils/types.ts";
import { AnalyticsItem } from "../../commerce/types.ts";
import type { Manifest } from "../manifest.gen.ts";
import { Context, state as storeState } from "./context.ts";
import { invoke } from "../runtime.ts";

const { cart, loading } = storeState;

export const mapOrderFormItemsToAnalyticsItems = (
  orderForm: Pick<OrderForm, "productItems" | "couponItems">,
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

type EnqueuableActions<
  K extends keyof Manifest["actions"],
> = Manifest["actions"][K]["default"] extends
  (...args: any[]) => Promise<Context["cart"]> ? K : never;

const enqueue = <
  K extends keyof Manifest["actions"],
>(key: EnqueuableActions<K>) =>
(props: Parameters<Manifest["actions"][K]["default"]>[0]) =>
  storeState.enqueue((signal) =>
    invoke({ cart: { key, props } } as any, { signal }) as any
  );

const state = {
  cart,
  loading,
  addItems: enqueue("salesforce/actions/cart/addItems.ts"),
  /*
  TODO: Create actions on the card
  updateItems: wrap(
    Runtime.create("deco-sites/std/actions/vtex/cart/updateItems.ts"),
  ), */
  mapItemsToAnalyticsItems: mapOrderFormItemsToAnalyticsItems,
};

export const useCart = () => state;
