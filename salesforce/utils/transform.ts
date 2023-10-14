// deno-lint-ignore-file
import { slugfy } from "./utils.ts";
import type {
  BrandSuggestions,
  CategorySuggestions,
  ImageGroups,
  ProductBaseSalesforce,
  ProductSeachHits,
  ProductSearch,
  ProductSearchRefinments,
  ProductSuggestions,
  SelectedRefinement,
  Variants,
  VariationAttributes,
} from "./types.ts";
import type {
  BreadcrumbList,
  ImageObject,
  Offer,
  Product,
  ProductDetailsPage,
  ProductGroup,
  PropertyValue,
  Suggestion,
} from "deco-sites/std/commerce/types.ts";
import type { ProductListingPage, Search } from "../../commerce/types.ts";

type SalesforceProduct =
  | ProductBaseSalesforce
  | ProductSeachHits;

export const toProductPage = (
  product: ProductBaseSalesforce,
  baseURL: string,
): ProductDetailsPage => ({
  "@type": "ProductDetailsPage",
  breadcrumbList: toBreadcrumbList(product, baseURL),
  product: toProduct(product, baseURL),
  seo: {
    title: toSEOTitle(product),
    description: product.pageDescription ?? product.shortDescription ?? "",
    canonical: getProductURL(
      baseURL,
      product.name,
      product.id,
      product?.variants?.at(0)?.productId!,
    ).href,
  },
});

export const toProductList = (
  products: ProductSearch,
  baseURL: string,
): Product[] => {
  return products.hits.map(
    ({
      productId,
      productName,
      variationAttributes,
      image,
      currency,
      price,
      orderable,
      representedProduct,
    }) => {
      const offers = toOffer(price, orderable, orderable ? 10 : 0);
      return {
        "@type": "Product",
        id: productId,
        productID: productId,
        url: getProductURL(
          baseURL,
          productName,
          productId,
          representedProduct?.id!,
        ).href,
        name: productName,
        additionalProperty: toAdditionalProperties(variationAttributes),
        image: [
          {
            "@type": "ImageObject",
            alternateName: image.alt,
            url: image.link,
          },
        ],
        sku: representedProduct?.id ?? "",
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: currency,
          highPrice: price,
          lowPrice: price,
          offerCount: offers.length,
          offers,
        },
      };
    },
  );
};

export const toProductSuggestions = (
  suggestions: ProductSuggestions,
  baseURL: string,
): Product[] => {
  return suggestions.products.map(
    ({
      productId,
      productName,
      currency,
      price,
    }) => {
      return {
        "@type": "Product",
        id: productId,
        productID: productId,
        url: getProductGroupURL(
          baseURL,
          productName,
          productId,
        ).href,
        image: [
          {
            "@type": "ImageObject",
            alternateName: "",
            url: "",
          },
        ],
        name: productName,
        sku: productId ?? "",
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: currency,
          highPrice: price,
          lowPrice: price,
          offerCount: 0,
          offers: [],
        },
      };
    },
  );
};

export const toSearchSuggestions = (
  searchPhrase: string,
  suggestions: ProductSuggestions,
  hitsCount: number,
): Search[] => {
  /*   const facets = suggestions.suggestedTerms.map((term) =>
    Object.entries(term).map(([key, values]) => ({
      values: values.map((v: { value: string }) => v.value),
      key,
    }))
  ); */

  return suggestions.suggestedTerms.map(({ terms, originalTerm }) => {
    return {
      term: originalTerm,
      hits: hitsCount,
      href: "",
      facets: [],
    };
  });
};

export const toProductSuggestionsdois = (
  suggestions: ProductSuggestions,
  baseURL: string,
): Product[] => {
  return suggestions.products.map(
    ({
      productId,
      productName,
      currency,
      price,
    }) => {
      return {
        "@type": "Product",
        id: productId,
        productID: productId,
        url: getProductGroupURL(
          baseURL,
          productName,
          productId,
        ).href,
        image: [
          {
            "@type": "ImageObject",
            alternateName: "",
            url: "",
          },
        ],
        name: productName,
        sku: productId ?? "",
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: currency,
          highPrice: price,
          lowPrice: price,
          offerCount: 0,
          offers: [],
        },
      };
    },
  );
};

const toSEOTitle = ({ name, pageTitle, brand }: ProductBaseSalesforce) => {
  const SEOTitle = pageTitle ?? name;
  return brand ? `${SEOTitle}, ${brand}` : SEOTitle;
};

const toBreadcrumbList = (
  { primaryCategoryId, name, id }: ProductBaseSalesforce,
  baseURL: string,
): BreadcrumbList => {
  const categories = toCategory(primaryCategoryId).split(/[>]/);

  return {
    "@type": "BreadcrumbList",
    itemListElement: [
      ...categories.map((name, index) => ({
        "@type": "ListItem" as const,
        name,
        item: new URL(
          `/${
            categories
              .slice(0, index + 1)
              .join("/")
              .toLowerCase()
          }`,
          baseURL,
        ).href,
        position: index + 1,
      })),
      {
        "@type": "ListItem",
        name: name,
        item: getProductURL(baseURL, name, id, id).href,
        position: categories.length + 1,
      },
    ],
    numberOfItems: categories.length + 1,
  };
};

export const toProduct = (
  product: ProductBaseSalesforce,
  baseURL: string,
): Product => {
  const {
    primaryCategoryId,
    id,
    name,
    pageDescription,
    brand,
    imageGroups,
    price,
    inventory,
  } = product;

  const isVariantOf = product.variants
    ? toVariantProduct(product, product.variants, baseURL)
    : undefined;

  const offers = toOffer(price, inventory.orderable, inventory.stockLevel);
  return {
    "@type": "Product",
    category: toCategory(primaryCategoryId),
    productID: id,
    url: getProductURL(baseURL, name, id, product.variants?.at(0)?.productId!)
      .href,
    name: name,
    description: pageDescription,
    brand: {
      "@type": "Brand",
      name: brand,
    },
    gtin: id,
    additionalProperty: toAdditionalProperties(
      product.variationAttributes,
      product,
    ),
    isVariantOf,
    sku: product.variants?.at(0)?.productId!,
    image: imageGroups
      .filter((obj) => !obj.variationAttributes && obj.viewType === "large")
      .flatMap((obj) =>
        obj.images.map((image) => ({
          "@type": "ImageObject",
          alternateName: image.alt,
          url: image.link,
        }))
      ),
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: product.currency,
      highPrice: product.priceMax ?? product.price,
      lowPrice: product.price,
      offerCount: offers.length,
      offers,
    },
  };
};

export const toProductHit = (
  product: ProductSeachHits,
  baseURL: string,
): Product => {
  const {
    productId,
    productName,
    image,
    price,
  } = product;

  return {
    "@type": "Product",
    productID: productId,
    url: getProductGroupURL(baseURL, productName, productId)
      .href,
    name: productName,
    gtin: productId,
    additionalProperty: toAdditionalProperties(
      product.variationAttributes,
      product,
    ),
    sku: productId,
    image: [{
      "@type": "ImageObject",
      url: image.link,
      alternateName: image.alt,
    }],
  };
};

const toCategory = (category: string) =>
  category
    .replace(/[-_/]/g, ">")
    .split(">")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(">");

const toVariantProduct = (
  master: ProductBaseSalesforce,
  variants: Variants[],
  baseURL: string,
): ProductGroup => ({
  "@type": "ProductGroup",
  productGroupID: master.id,
  hasVariant: variants.map((variant) => {
    const offers = toVariantOffer(variant);
    return {
      "@type": "Product",
      category: toCategory(master.primaryCategoryId),
      productID: variant.productId,
      url:
        getProductURL(baseURL, master.name, master.id, variant.productId).href,
      name: master.name,
      description: master.pageDescription,
      brand: {
        "@type": "Brand",
        name: master.brand,
      },
      sku: variant.productId,
      gtin: variant.productId,
      additionalProperty: toVariantAdditionalProperties(
        variant.variationValues,
        master.variationAttributes,
      ),
      image: toVariantImages(master.imageGroups, variant.variationValues),
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: master.currency,
        highPrice: variant.price,
        lowPrice: variant.price,
        offerCount: offers.length,
        offers,
      },
    };
  }),
  url:
    getProductURL(baseURL, master.name, master.id, variants[0].productId).href,
  name: master.name,
  additionalProperty: toExtraAdditionalProperties(master),
  model: master.id,
});

const getProductGroupURL = (
  origin: string,
  productName: string,
  productId?: string,
) => new URL(`/p/${slugfy(productName)}/${productId}`, origin);

const getProductURL = (
  origin: string,
  productName: string,
  mastertId: string,
  variantId: string,
) => {
  const canonicalUrl = getProductGroupURL(origin, productName, mastertId);

  if (variantId) {
    canonicalUrl.searchParams.set("skuId", variantId);
  }

  return canonicalUrl;
};

const toAdditionalProperties = (
  variationAttributes: VariationAttributes[] | undefined,
  product?: SalesforceProduct,
): PropertyValue[] => {
  const propietiesFromVariationAttr: PropertyValue[] =
    variationAttributes?.flatMap(({ name, values }) =>
      values.map(
        (value) => ({
          "@type": "PropertyValue",
          name: name,
          value: value.name,
          propertyID: value.value,
        }),
      )
    ) ?? [];

  if (product) {
    const proprietiesFromExtraAttr = toExtraAdditionalProperties(product);
    return propietiesFromVariationAttr.concat(proprietiesFromExtraAttr);
  }

  return propietiesFromVariationAttr;
};

const toExtraAdditionalProperties = (
  product: SalesforceProduct,
): PropertyValue[] => {
  return Object.entries(product)
    .filter(([key]) => key.startsWith("c_"))
    .map(([key, value]) => ({
      "@type": "PropertyValue",
      name: key.substring(2),
      value,
      valueReference: "PROPERTY",
    }));
};

const toVariantAdditionalProperties = (
  variationValues: Record<string, string>,
  variationAttributes: VariationAttributes[] | undefined,
): PropertyValue[] => {
  if (!variationAttributes) return [];

  const result = variationAttributes.reduce((acc, attribute) => {
    const fieldValue = variationValues[attribute.id];
    const matchingValue = attribute.values.find(
      (val) => val.value === fieldValue,
    );

    if (matchingValue) {
      acc.push({
        "@type": "PropertyValue",
        name: attribute.name,
        value: matchingValue.name,
        propertyID: matchingValue.value,
      });
    }

    return acc;
  }, [] as PropertyValue[]);

  return result;
};

const toVariantImages = (
  imageGroup: ImageGroups[],
  variationValues: Record<string, string>,
): ImageObject[] =>
  imageGroup.flatMap((item) =>
    item.variationAttributes?.some(
        (attr) =>
          variationValues[attr.id] &&
          attr.values.some(
            (subAttr) => subAttr.value === variationValues[attr.id],
          ),
      ) && item.viewType == "large"
      ? item.images.map((value) => ({
        "@type": "ImageObject",
        alternateName: value.alt,
        url: value.link,
      }))
      : []
  );

const toOffer = (
  price: number,
  orderable: boolean,
  stockLevel: number,
): Offer[] => [
  {
    "@type": "Offer",
    price: price,
    inventoryLevel: { value: stockLevel },
    seller: "Salesforce",
    priceSpecification: [
      {
        "@type": "UnitPriceSpecification",
        priceType: "https://schema.org/ListPrice",
        price: price,
      },
      {
        "@type": "UnitPriceSpecification",
        priceType: "https://schema.org/SalePrice",
        price: price,
      },
    ],
    availability: orderable
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock",
  },
];

const toVariantOffer = (variant: Variants): Offer[] => [
  {
    "@type": "Offer",
    price: variant.price,
    inventoryLevel: { value: variant.orderable ? 10 : 0 },
    seller: "Salesforce",
    priceSpecification: [
      {
        "@type": "UnitPriceSpecification",
        priceType: "https://schema.org/ListPrice",
        price: variant.price,
      },
      {
        "@type": "UnitPriceSpecification",
        priceType: "https://schema.org/SalePrice",
        price: variant.price,
      },
    ],
    availability: variant.orderable
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock",
  },
];

export const toFilters = (
  refinements: ProductSearchRefinments[],
  currentFilters: string[],
  url: URL,
): ProductListingPage["filters"] =>
  (refinements ?? [])?.map((f) => ({
    "@type": "FilterToggle",
    label: f.label,
    key: f.attributeId,
    values: (f.values ?? []).map(
      ({ value: value, hitCount: quantity, label: label }) => {
        const index = currentFilters.findIndex((x) => x === value);
        const selected = index > -1;
        const newFilters = selected
          ? currentFilters.filter((x) => x !== value)
          : [...currentFilters, value];

        const params = new URLSearchParams(url.searchParams);
        params.set("filter", newFilters.join("/"));
        console.log("params", params);
        return {
          value,
          label,
          quantity,
          selected,
          url: `?${
            filtersToSearchParams(
              [{ key: f.attributeId, value: value }],
              params,
            )
          }`,
        };
      },
    ),
    quantity: 0,
  }));

export const filtersToSearchParams = (
  selectedRefinements: SelectedRefinement[],
  paramsToPersist?: URLSearchParams,
) => {
  const searchParams = new URLSearchParams(paramsToPersist);

  for (const { key, value } of selectedRefinements) {
    searchParams.append(`filter.${key}`, value);
  }

  return searchParams;
};

export const filtersFromURL = (url: URL) => {
  const selectedRefinements: SelectedRefinement[] = [];

  url.searchParams.forEach((value, name) => {
    const [filter, key] = name.split(".");

    if (filter === "filter" && typeof key === "string") {
      selectedRefinements.push({ key, value });
    }
  });

  return selectedRefinements;
};

export const getHeaders = (
  token: string,
): Headers => {
  const headers = new Headers({
    accept: "application/json",
    Authorization: `Bearer ${token}`,
  });
  return headers;
};
