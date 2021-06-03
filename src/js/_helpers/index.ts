/**
 * This module re-exports helper functionality for neater importing.
 *
 * @category Helpers
 * @category Re-export
 *
 * @module Helpers
 *
 * @hidden
 */

import { ajaxPOST, ajaxGET, ajaxPATCH, ajaxDELETE } from './ajax';
import { isLoggedIn, redirect } from './checkLogin';
import { reportWIP } from './wip';
import RefreshTokenService from './refreshToken.service';
import ErrorHandler from './errorHandler';
import { AssetLocation, AssetLocations, GameState, GameType } from './enums';

/**
 * Formats numeric values into currency values.
 *
 * @category Helpers
 */
const formatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
});

export {
  ajaxPOST,
  ajaxGET,
  ajaxPATCH,
  ajaxDELETE,
  isLoggedIn,
  redirect,
  ErrorHandler,
  reportWIP,
  RefreshTokenService,
  AssetLocation,
  AssetLocations,
  GameState,
  GameType,
  formatter,
};

/* eslint-disable @typescript-eslint/ban-types */
/**
 * Gets all keys from an enum.
 *
 * @category Helpers
 *
 * @link https://www.petermorlion.com/iterating-a-typescript-enum/
 *
 * @typeParam O  The enum class.
 * @typeParam K  The key class.
 * @param obj  The enum object.
 * @return  The array of keys.
 */
export function enumKeys<O extends object, K extends keyof O = keyof O>(obj: O): K[] {
  return Object.keys(obj).filter((k) => Number.isNaN(+k)) as K[];
}
/* eslint-enable @typescript-eslint/ban-types */
