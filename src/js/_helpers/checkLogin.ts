/**
 * This module checks user logins and handles redirects.
 *
 * @category Helpers
 *
 * @module CheckLogin
 */

/**
 * Checks whether the user is currently logged in.
 *
 * This checks for the existence of a JSON Web Token in the local storage.
 * It does not check the validity of that token.
 *
 * @category Helpers
 * @category Authn/Authz
 *
 * @return  Whether the user is currently logged in or not.
 */
export function isLoggedIn(): boolean {
  return !!localStorage.getItem('token');
}

/**
 * Redirects the user to a new page.
 *
 * @category Helpers
 *
 * @param page  The name of the page to redirect to.
 */
export function redirect(page: string): void {
  if (page === '/') window.location.replace(`${process.env.APP_PATH}/`);
  else window.location.replace(`${process.env.APP_PATH}/${page}.html`);
}
