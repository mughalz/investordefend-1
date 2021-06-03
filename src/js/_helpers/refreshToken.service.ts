/**
 * This module defines the refresh token service, continually refreshes a
 * logged-in user's JSON Web Token (JWT).
 *
 * @category Helpers
 * @category Services
 * @category Authn/Authz
 *
 * @module RefreshTokenService
 */

import { isLoggedIn } from '../_helpers';
import { AjaxService } from '../_helpers/ajax';

/**
 * Represents the refresh token service.
 */
export default class RefreshTokenService {
  /**
   * Refreshes the token on load.
   */
  constructor() {
    if (isLoggedIn()) RefreshTokenService.refreshToken(false);
  }

  /**
   * Refreshes the user's JWT.
   *
   * @param isAsyc  Whether the request should be handled asynchronously or not.
   */
  static async refreshToken(isAsync = true): Promise<void> {
    const jwtToken: string = await AjaxService.refreshToken(isAsync, RefreshTokenService._getCookie('refreshToken'));

    if (jwtToken) localStorage.setItem('token', jwtToken);
    else localStorage.removeItem('token');
  }

  /**
   * Get the refresh token value from its cookie.
   *
   * @param cname  The cookie name.
   * @return  The cookie value.
   */
  private static _getCookie(cname: string): string {
    const name = cname + '=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return '';
  }
}
