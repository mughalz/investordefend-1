/**
 * This module represents the AJAX service, which processes all AJAX requests to
 * the server.
 *
 * @category Helpers
 * @category AJAX
 * @category Services
 *
 * @module AjaxService
 *
 * @todo Finish refactoring into aservice.
 */

import $ from 'jquery';

/**
 * The default error handler.
 *
 * @todo Utilise {@link ErrorHandler}.
 * @todo Use `statusCode` instead.
 */
const defaultErrorFn = (xhr) => {
  console.error(`Error - ${xhr.status}: ${xhr.statusText}`);
  window.alert(`Error - ${xhr.status}: ${xhr.statusText}`);
};

/**
 * Strips the leading slash from a given URL.
 *
 * @param url  The URL to filter.
 * @return  The stripped URL.
 */
function stripLeadingSlash(url: string): string {
  return url.replace(/^\/+/, '');
}

/**
 * Represents the AJAX service.
 */
export class AjaxService {
  /**
   * Refreshes the user's JSON Web Token (JWT).
   *
   * @category AJAX
   * @category Authn/Authz
   *
   * @async
   *
   * @param isAsync  Whether to run the request asynchronously nor not.
   * @param token  The refresh token.
   * @return  The new JWT.
   */
  static async refreshToken(isAsync: boolean, token: string): Promise<string> {
    const { jwtToken }: { jwtToken: string } = await await $.ajax({
      type: 'POST',
      url: `${process.env.API_URL}/users/refresh-token`,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      xhrFields: {
        withCredentials: true,
      },
      async: isAsync,
      data: {
        refreshToken: token,
      },
    });

    return jwtToken;
  }

  /**
   * Gets all game tutorials.
   *
   * @category AJAX
   * @category Game
   *
   * @async
   *
   * @return  The tutorial values.
   */
  static async getTutorial(): Promise<string> {
    const { value: tutorials } = await $.ajax({
      type: 'GET',
      url: `${process.env.API_URL}/games/get/setting/tutorials`,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      xhrFields: {
        withCredentials: true,
      },
    });

    return tutorials.find((tutorial) => {
      return !tutorial.state;
    }).text;
  }

  /**
   * Gets all default game settings.
   *
   * @category AJAX
   * @category Game
   *
   * @async
   *
   * @return  The default game settings.
   */
  static async getGameDefaults(): Promise<{
    size: string;
    industry: string;
    startingBalance: number;
    maxTurns: number;
    incomePerTurn: number;
    incidentMinCost: number;
    incidentMaxCost: number;
  }> {
    const {
      value: { size, industry, startingBalance, maxTurns, incomePerTurn, incidentMinCost, incidentMaxCost },
    } = await $.ajax({
      type: 'GET',
      url: `${process.env.API_URL}/games/get/setting/gameDefaults`,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      xhrFields: {
        withCredentials: true,
      },
    });

    return { size, industry, startingBalance, maxTurns, incomePerTurn, incidentMinCost, incidentMaxCost };
  }
}

/**
 * Sends a POST request to the server.
 *
 * @category AJAX
 *
 * @param url  The URL to send the request to.
 * @param authHeader  Whether the request requires authn/authz or not.
 * @param data  Any data to send with the request.
 * @param successFn  The success callback function.
 * @param errorFn  A custom error callback function.
 *
 * @todo Refactor into {@link AjaxService}.
 */
export function ajaxPOST({
  url,
  authHeader = false,
  data = undefined,
  successFn,
  errorFn = defaultErrorFn,
}: {
  url: string;
  authHeader?: boolean;
  data?: Record<string, unknown>;
  successFn?;
  errorFn?;
}): void {
  $.ajax({
    type: 'POST',
    url: `${process.env.API_URL}/${stripLeadingSlash(url)}`,
    headers: authHeader && {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    contentType: 'application/json',
    data: JSON.stringify(data),
    xhrFields: {
      withCredentials: true,
    },
  })
    .done(successFn)
    .fail(errorFn);
}

/**
 * Sends a GET request to the server.
 *
 * @category AJAX
 *
 * @param url  The URL to send the request to.
 * @param authHeader  Whether the request requires authn/authz or not.
 * @param data  Any data to send with the request.
 * @param successFn  The success callback function.
 * @param errorFn  A custom error callback function.
 *
 * @todo Refactor into {@link AjaxService}.
 */
export function ajaxGET({
  url,
  authHeader = false,
  async = true,
  successFn,
  errorFn = defaultErrorFn,
}: {
  url: string;
  authHeader?: boolean;
  async?: boolean;
  successFn?;
  errorFn?;
}): void {
  $.ajax({
    type: 'GET',
    url: `${process.env.API_URL}/${stripLeadingSlash(url)}`,
    headers: authHeader && {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    xhrFields: {
      withCredentials: true,
    },
    async,
    contentType: 'application/json',
  })
    .done(successFn)
    .fail(errorFn);
}

/**
 * Sends a PATCH request to the server.
 *
 * @category AJAX
 *
 * @param url  The URL to send the request to.
 * @param authHeader  Whether the request requires authn/authz or not.
 * @param data  Any data to send with the request.
 * @param successFn  The success callback function.
 * @param errorFn  A custom error callback function.
 *
 * @todo Refactor into {@link AjaxService}.
 */
export function ajaxPATCH({
  url,
  authHeader = false,
  data = undefined,
  successFn,
  errorFn = defaultErrorFn,
}: {
  url: string;
  authHeader?: boolean;
  data?: Record<string, unknown>;
  successFn?;
  errorFn?;
}): void {
  $.ajax({
    type: 'PATCH',
    url: `${process.env.API_URL}/${stripLeadingSlash(url)}`,
    headers: authHeader && {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    data: JSON.stringify(data),
    contentType: 'application/json',
    xhrFields: {
      withCredentials: true,
    },
  })
    .done(successFn)
    .fail(errorFn);
}

/**
 * Sends a DELETE request to the server.
 *
 * @category AJAX
 *
 * @param url  The URL to send the request to.
 * @param authHeader  Whether the request requires authn/authz or not.
 * @param data  Any data to send with the request.
 * @param successFn  The success callback function.
 * @param errorFn  A custom error callback function.
 *
 * @todo Refactor into {@link AjaxService}.
 */
export function ajaxDELETE({
  url,
  authHeader = false,
  data = undefined,
  successFn,
  errorFn = defaultErrorFn,
}: {
  url: string;
  authHeader?: boolean;
  data?: Record<string, unknown>;
  successFn?;
  errorFn?;
}): void {
  $.ajax({
    type: 'DELETE',
    url: `${process.env.API_URL}/${stripLeadingSlash(url)}`,
    headers: authHeader && {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    data: JSON.stringify(data),
    contentType: 'application/json',
    xhrFields: {
      withCredentials: true,
    },
  })
    .done(successFn)
    .fail(errorFn);
}
