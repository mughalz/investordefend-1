/**
 * This file initialises the Web app. and exports it.
 *
 * @module App
 */

import $ from 'jquery';

import { isLoggedIn, redirect, reportWIP, RefreshTokenService } from './_helpers';

import UserService from './user.service';
import GameAdminService from './gameAdmin.service';
import GameService from './game.service';

import '../css/reset';
import '../css/main';

/**
 * Represents the Web app.
 */
class App {
  /**
   * The paths that are accessible by non-authenticated users.
   */
  private _exposedHREFs = [
    `${process.env.APP_PATH}/login.html`,
    `${process.env.APP_PATH}/reset-password.html`,
    `${process.env.APP_PATH}/forgot-password.html`,
    `${process.env.APP_PATH}/signup.html`,
  ];

  /**
   * Initialise the Web app., redirect the user if applicable and activate the
   * JWT refresh token service.
   */
  constructor() {
    //window.addEventListener('error', ErrorHandler.handleError);
    //window.addEventListener('unhandledrejection', ErrorHandler.handleError);

    new RefreshTokenService();

    if (!isLoggedIn() && !this._exposedHREFs.includes(window.location.href)) redirect('login');
    if (isLoggedIn() && window.location.href === `${process.env.APP_PATH}/`) redirect('main-menu');

    if (isLoggedIn()) setInterval(() => RefreshTokenService.refreshToken(), 100000);

    $(document).ready(() => {
      new UserService(isLoggedIn());

      switch (window.location.href) {
        case `${process.env.APP_PATH}/report-issue.html`:
        case `${process.env.APP_PATH}/main-menu.html`:
        case `${process.env.APP_PATH}/create-new-game.html`:
        case `${process.env.APP_PATH}/join-game.html`:
          new GameAdminService();
          break;
        case `${process.env.APP_PATH}/game.html`:
          new GameService();
          break;
        case `${process.env.APP_PATH}/`:
        case `${process.env.APP_PATH}/login.html`:
        case `${process.env.APP_PATH}/reset-password.html`:
        case `${process.env.APP_PATH}/forgot-password.html`:
        case `${process.env.APP_PATH}/signup.html`:
          break;
        default:
          console.warn('Unknown URL');
      }
    });

    this._importAll(require.context('../img', false, /\.(png|svg|jpe?g|gif)$/));
    this._importAll(require.context('../img/assets', false, /\.(png|svg|jpe?g|gif)$/));
    this._importAll(require.context('../img/controls', false, /\.(png|svg|jpe?g|gif)$/));

    $(document).on('click', '.wip', function (event) {
      event.preventDefault();
      reportWIP();
    });
  }

  /**
   * Import all files within a directory.
   *
   * @param function The function returned by `require.context` (`webpackContext()`).
   * @returns All of the required files.
   */
  private _importAll(r) {
    return r.keys().map(r);
  }
}

export const app = new App();
