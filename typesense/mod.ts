import type { App, AppContext as AC } from "deco/mod.ts";
import Typesense from "npm:typesense@1.7.1";
import { SecretString } from "../website/loaders/secretString.ts";
import manifest, { Manifest } from "./manifest.gen.ts";
import {
  ProductsCollectionName,
  setupProductsCollection,
} from "./utils/product.ts";

export type AppContext = AC<ReturnType<typeof App>>;

export interface State {
  /**
   * @title Your TypeSense location
   * @description e.g.: https://dry-pond-5415.fly.dev
   */
  apiUrls: string[];

  /**
   * @title API Key
   * @description https://dashboard.algolia.com/account/api-keys/all
   */
  apiKey: SecretString;
}

export type Collections = ProductsCollectionName;

/**
 * @title TypeSense
 */
export default function App(
  props: State,
) {
  const { apiKey, apiUrls } = props;

  if (!apiKey) {
    throw new Error("Missing API key");
  }

  const options = {
    nodes: apiUrls.map((href) => {
      const url = new URL(href);

      return {
        protocol: url.protocol.replace(":", ""),
        host: url.host,
        port: url.port
          ? Number(url.port)
          : url.protocol.startsWith("https")
          ? 443
          : 80,
      };
    }),
    apiKey: apiKey,
    healthcheckIntervalSeconds: 5,
    logLevel: "error" as const,
  };

  const client = new Typesense.Client({
    ...options,
    numRetries: 10,
    connectionTimeoutSeconds: 60,
    retryIntervalSeconds: 0.3,
  });
  const searchClient = new Typesense.SearchClient({
    ...options,
    numRetries: 3,
    connectionTimeoutSeconds: 5,
    retryIntervalSeconds: 0.1,
  });

  const state = {
    ...props,
    products: setupProductsCollection(client, searchClient),
  };

  const app: App<Manifest, typeof state> = { manifest, state };

  return app;
}
