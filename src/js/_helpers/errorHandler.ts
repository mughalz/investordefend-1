/**
 * This module represents the error handler for the Web app. All exceptions
 * thrown elsewhere in the code are routed to this handler.
 *
 * @category Helpers
 * @category Error Handling
 *
 * @module ErrorHandler
 */

import { redirect } from '../_helpers';
/**
 * Represents the Web app. error handler.
 */
export default class ErrorHandler {
  /*eslint-disable @typescript-eslint/explicit-module-boundary-types */
  /**
   * Catch all exceptions thrown elsewhere.
   *
   * @category Helpers
   * @category Error Handling
   *
   * @param e  The error object (or string in the case of a custom error).
   *
   * @todo Rewrite.
   */
  static handleError(e): void {
    /*eslint-enable @typescript-eslint/explicit-module-boundary-types */
    console.error(e);

    if (e.reason.status) {
      switch (e.reason.status) {
        case 401:
          ErrorHandler._handleUnauthorisedError(e.reason.status, e.reason.responseJSON.message || e.reason.statusText);
          break;
        case 403:
          ErrorHandler._handleForbiddenError(e.reason.status, e.reason.responseJSON.message || e.reason.statusText);
          break;
        case 400:
          if (e.reason.responseJSON.message === 'Invalid token') {
            ErrorHandler._handleUnauthorisedError(403, 'Session has expired');
            break;
          }
        default:
          ErrorHandler._handleUnknownError(e.reason.status, e.reason.responseJSON.message || e.reason.statusText);
      }
    }
  }

  /**
   * Handle authn errors.
   *
   * @category Helpers
   * @category Error Handling
   * @category Authn/Authz
   *
   * @param code  The HTTP response code.
   * @param message  The error message.
   *
   * @todo Rewrite.
   */
  private static _handleUnauthorisedError(code: number, message: string): void {
    window.alert(`${code}: ${message}`);
    localStorage.removeItem('token');
    redirect('/');
  }

  /**
   * Handle authz errors.
   *
   * @category Helpers
   * @category Error Handling
   * @category Authn/Authz
   *
   * @param code  The HTTP response code.
   * @param message  The error message.
   *
   * @todo Rewrite.
   */
  private static _handleForbiddenError(code: number, message: string): void {
    window.alert(`${code}: ${message}`);
  }

  /**
   * Handle unknown errors.
   *
   * @category Helpers
   * @category Error Handling
   *
   * @param code  The HTTP response code.
   * @param message  The error message.
   *
   * @todo Rewrite.
   */
  private static _handleUnknownError(code: number, message: string): void {
    window.alert(`${code}: ${message}`);
  }
}
