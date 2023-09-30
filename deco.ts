const app = (name: string) => ({ dir: name, name });

const compatibilityApps = [{
  dir: "./compat/$live",
  name: "$live",
}, {
  dir: "./compat/std",
  name: "deco-sites/std",
}];

const config = {
  apps: [
    app("salesforce"),
    {
      dir: "admin",
      name: "deco-sites/admin",
    },
    app("typesense"),
    app("algolia"),
    app("handlebars"),
    app("vtex"),
    app("vnda"),
    app("wake"),
    app("shopify"),
    app("website"),
    app("commerce"),
    app("workflows"),
    app("verified-reviews"),
    app("decohub"),
    ...compatibilityApps,
  ],
};

export default config;
