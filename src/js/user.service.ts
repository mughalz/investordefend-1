/**
 * This module defines the user service, which processes all requests relating
 * to the user (including authentication and authorisation).
 *
 * @category User
 * @category Services
 *
 * @module UserService
 */

import $ from 'jquery';

import { ajaxPOST, ajaxDELETE, redirect } from './_helpers';

/**
 * Represents the user service.
 */
export default class UserService {
  /**
   * Whether the user is currently logged-in or not.
   */
  private _isLoggedIn: boolean;

  /**
   * Registers required jQuery callbacks.
   */
  constructor(isLoggedIn = false) {
    this._isLoggedIn = isLoggedIn;

    if (!this._isLoggedIn) {
      $('.form#signup').submit((event) => {
        event.preventDefault();
        this.signUp();
      });

      $('.form#signin').submit((event) => {
        event.preventDefault();
        this.logIn();
      });
    } else {
      $('.button#logout').click(this.logOut);
    }
  }

  /**
   * Sends a POST request to register a new user.
   *
   * @category User
   * @category AJAX
   */
  signUp(): void {
    const data = {
      newDetails: {
        username: $('#email').val(),
        password: $('#password').val(),
        name: $('#name').val(),
      },
    };

    ajaxPOST({
      url: 'users/register',
      data,
      successFn: () => {
        window.alert('User created successfully');
        redirect('login');
      },
    });
  }

  /**
   * Sends a POST request to authenticate the user.
   *
   * If successful, this stores the JWT in local storage and reriects the user
   * to the game.
   *
   * @category User
   * @category AJAX
   */
  logIn(): void {
    const data = {
      username: $('#username').val(),
      password: $('#password').val(),
    };

    ajaxPOST({
      url: 'users/login',
      data,
      successFn: (data) => {
        localStorage.setItem('token', data.jwtToken);
        localStorage.setItem('userId', data.id);
        redirect('/');
      },
    });
  }

  /**
   * Sends a DELETE request to log the user out.
   *
   * If successful, this also clears local storage and redirects the user to the
   * login screen.
   *
   * @category User
   * @category AJAX
   */
  logOut(): void {
    ajaxDELETE({
      url: 'users/logout',
      authHeader: true,
      successFn: () => {
        localStorage.clear();
        window.alert('Logged out of all devices!');
        redirect('/');
      },
    });
  }
}
