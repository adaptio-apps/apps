import type { App, AppContext as AC, ManifestOf } from "deco/mod.ts";
import manifest, { Manifest } from "./manifest.gen.ts";
import type { Account } from "./utils/types.ts";
import {SalesforceClient  } from "./utils/client.ts";
import { createHttpClient } from "../utils/http.ts";
import { fetchAPI } from "../utils/fetch.ts"


export type AppContext = AC<ReturnType<typeof Salesforce>>;

export type AppManifest = ManifestOf<ReturnType<typeof Salesforce>>;

/** @title Salesforce */
export interface Props extends Account {
  platform: "salesforce";
}
/**
 * @title Salesforce
 */
export default function Salesforce(
  prop: Props,
){

  const slc = createHttpClient<SalesforceClient>({
    base: `https://${prop.shortCode}.api.commercecloud.salesforce.com`,
    fetcher: fetchAPI,
  });

  const state = { ...prop, slc };


  const app: App<Manifest, typeof state> = {
    state,
    manifest,
  };

  return app;
}

