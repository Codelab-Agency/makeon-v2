import type { CoffeeProduct } from "./coffee-catalog";

/** Legacy/static fixtures keep their old ID until a persisted SKU is available. */
export function productSku(product: Pick<CoffeeProduct, "sku" | "slug">) {
  return product.sku ?? product.slug;
}

export function validGtin(value: string) {
  if (!/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(value) || /^0+$/.test(value)) return false;
  const digits = value.slice(0, -1).split("").reverse();
  const sum = digits.reduce((total, digit, index) => total + Number(digit) * (index % 2 === 0 ? 3 : 1), 0);
  return (sum + Number(value[value.length - 1])) % 10 === 0;
}

export function productBrand(product: Pick<CoffeeProduct, "brand" | "category">) {
  return product.brand?.trim() || (product.category === "complementare" ? undefined : "SwitchMORN Coffee");
}

export function gtinSchemaFields(gtin?: string | null) {
  const fields: {gtin8?: string; gtin12?: string; gtin13?: string; gtin14?: string} = {};
  if (gtin && validGtin(gtin)) fields[`gtin${gtin.length}` as keyof typeof fields] = gtin;
  return fields;
}
