/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as addRealData from "../addRealData.js";
import type * as auth from "../auth.js";
import type * as clearConvexData from "../clearConvexData.js";
import type * as compliance from "../compliance.js";
import type * as debug from "../debug.js";
import type * as debug_invite from "../debug_invite.js";
import type * as debug_state from "../debug_state.js";
import type * as facetMergePolicies from "../facetMergePolicies.js";
import type * as fixRole from "../fixRole.js";
import type * as http from "../http.js";
import type * as invitations from "../invitations.js";
import type * as loads from "../loads.js";
import type * as organizations from "../organizations.js";
import type * as permitTypes from "../permitTypes.js";
import type * as policies from "../policies.js";
import type * as stateFields from "../stateFields.js";
import type * as systemFields from "../systemFields.js";
import type * as trailers from "../trailers.js";
import type * as trucks from "../trucks.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  addRealData: typeof addRealData;
  auth: typeof auth;
  clearConvexData: typeof clearConvexData;
  compliance: typeof compliance;
  debug: typeof debug;
  debug_invite: typeof debug_invite;
  debug_state: typeof debug_state;
  facetMergePolicies: typeof facetMergePolicies;
  fixRole: typeof fixRole;
  http: typeof http;
  invitations: typeof invitations;
  loads: typeof loads;
  organizations: typeof organizations;
  permitTypes: typeof permitTypes;
  policies: typeof policies;
  stateFields: typeof stateFields;
  systemFields: typeof systemFields;
  trailers: typeof trailers;
  trucks: typeof trucks;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
