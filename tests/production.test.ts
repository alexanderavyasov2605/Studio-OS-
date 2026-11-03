import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
function check(extra: Record<string,string | undefined>) {
  const result = spawnSync(process.execPath,[require.resolve("tsx/cli"),"scripts/check-production.ts"], { env:{...process.env,NODE_ENV:"production",APP_ORIGIN:"https://studio.example.invalid",DATABASE_URL:"postgresql://fixture:fixture-not-real@db.example.invalid:5432/test?sslmode=require",DIRECT_URL:"",ADMIN_EMAIL:"",ADMIN_PASSWORD:"",...extra},encoding:"utf8",windowsHide:true });
  return { code:result.status, text:result.stdout+result.stderr };
}
describe("production preflight",()=>{
  it("accepts HTTPS and database TLS without connecting or printing secrets",()=>{const r=check({});expect(r.code).toBe(0);expect(r.text).not.toContain("fixture-not-real");});
  it("fails closed for missing origin, insecure remote DB and persisted bootstrap secrets",()=>{
    for(const env of [{APP_ORIGIN:""},{APP_ORIGIN:"http://studio.example.invalid"},{DATABASE_URL:"postgresql://fixture:fixture-not-real@db.example.invalid/test"},{ADMIN_PASSWORD:"fixture-not-real"}]) { const r=check(env);expect(r.code).toBe(1);expect(r.text).not.toContain("fixture-not-real"); }
  });
});
