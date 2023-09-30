import type { App, AppContext as AC } from "deco/mod.ts";
import manifest, { Manifest } from "./manifest.gen.ts";
import type { Account } from "./utils/types.ts";

export interface Props extends Account {
  platform: "salesforce";
}
/**
 * @title salesforce
 */
export default function App(
  state: Props,
): App<Manifest, Props> {
  return { manifest, state };
}

export type AppContext = AC<ReturnType<typeof App>>;
