import { describe, expect, it } from "vitest";
import { parseProduct, validImageUrl } from "../server/catalog/validation";
const input = () => ({ name: "Товар", slug: "product-one", description: "Описание", features: ["Особенность"], calculationMode: "MANUAL_REQUEST", categoryId: "10000000-0000-4000-8000-000000000000", isActive: false, sortOrder: 1, materialIds: ["20000000-0000-4000-8000-000000000000"], images: [{ url: "https://example.invalid/photo.webp", alt: "Описание фото" }] });
describe("catalog input boundary", () => {
  it("requires explicit calculation mode, known fields and complete publishable content", () => {
    expect(parseProduct(input(), false).calculationMode).toBe("MANUAL_REQUEST");
    for (const bad of [{...input(),calculationMode:"UNKNOWN"}, {...input(),roles:["ADMIN"]}, {...input(),images:[]}, {...input(),materialIds:[]}, {...input(),slug:"../escape"}, {...input(),sortOrder:-1}]) expect(() => parseProduct(bad,false)).toThrow();
    expect(() => parseProduct(input(),true)).toThrow();
    expect(parseProduct({...input(),revision:3},true).revision).toBe(3);
  });
  it("rejects executable/local URLs and requires useful image descriptions", () => {
    for (const url of ["javascript:alert(1)","data:image/svg+xml,a","file:///secret","http://example.com/a","//example.com/a","/api/admin/session","https://user:pass@example.com/a"]) expect(validImageUrl(url)).toBe(false);
    expect(validImageUrl("/catalog-art/tags.svg")).toBe(true);
    expect(() => parseProduct({...input(), images:[{url:"https://example.com/a",alt:" "}]},false)).toThrow();
  });
});
