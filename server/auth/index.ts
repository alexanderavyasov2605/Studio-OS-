import "server-only";

// Shared server entry point; internal modules are also used by the non-browser CLI/tests.
export { actorForSession, requireActor } from "./service";
export { sessionCookieName } from "./config";
export type { Actor } from "./service";
