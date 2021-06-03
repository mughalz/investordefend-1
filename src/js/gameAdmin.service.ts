/**
 * This module defines the game administration service, which processes all
 * requests relating to viewing, creating and joining games.
 *
 * This service only handles game admin. For the running of the games
 * themselves, see {@link GameService}.
 *
 * @category Game
 * @category Services
 *
 * @module GameAdminService
 */

import $, { JQuery } from 'jquery';

import { ajaxGET, ajaxPATCH, ajaxPOST, redirect, GameType } from './_helpers';
import { AjaxService } from './_helpers/ajax';
import { Game } from './types/typings.d';

import AjaxLoader from '../img/ajax-spinner.gif';

/**
 * Represents the game admin. service.
 */
export default class GameAdminService {
  /**
   * The spinner to display when an AJAX call is in progress.
   *
   * @todo Doesn't work in built app.
   * @todo Add type.
   */
  private _spinner;

  /**
   * Registers required jQuery callbacks.
   *
   * @category Game
   */
  constructor() {
    this._spinner = new Image();
    this._spinner.src = AjaxLoader;

    if ($('.form#create-new-game').length) {
      $('#additional-organisations').hide();

      this.populateSizeOptions();
      this.populateIndustryOptions();
      this.populateSourceOptions();
      this.addGameTypeRadios();
      this.populateDefaultValues();
    }

    $('.form#create-new-game').submit((event: JQuery.Event) => {
      event.preventDefault();
      this.createNewGame();
    });

    $('.form#join-game').submit((event: JQuery.Event) => {
      event.preventDefault();
      this.joinGame();
    });

    $('.form#report-issue').submit((event: JQuery.Event) => {
      event.preventDefault();
      this.reportIssue();
    });

    $('input[name=game-type]').change((event: JQuery.Event) => {
      switch (Number($(event.target).val())) {
        case GameType.SinglePlayer:
        case GameType.Cooperative:
          $('#additional-organisations').hide();
          break;
        case GameType.Competitive:
          $('#additional-organisations').show();
          break;
        default:
          throw 'Unknown game type!';
      }
    });

    $('#additional-organisations').show(() => {
      $('#new-organisation-details').html('');
    });

    $('#add-additional-organisation').click(() => {
      const idx = $('#new-organisation-details').children('fieldset').length + 1;
      $('#new-organisation-details').html($('#new-organisation-details').html() + this._addOrganisationFormFields(idx));

      this.populateSizeOptions();
      this.populateIndustryOptions();
    });

    $('#how-to-play-button').click(this.showTutorial);

    $('.modal__button--close').click((event: JQuery.Event) => {
      $(event.target).parent().parent('.modal').removeClass('modal--visible');
    });

    $('#additional-organisations').hide();
  }

  /**
   * Shows the game tutorial.
   *
   * @category Game
   * @category AJAX
   *
   * @async
   */
  async showTutorial(): Promise<void> {
    $('.modal#how-to-play .modal__content').html(this._spinner);

    $('.modal#how-to-play .modal__content').html(await AjaxService.getTutorial());

    $('.modal#how-to-play').addClass('modal--visible');
  }

  /**
   * Populate the list of game ‘Source’ options when creating a new game.
   *
   * @category Game
   * @category AJAX
   *
   * @todo Make async.
   * @todo Use {@link AjaxService}.
   */
  populateSourceOptions(): void {
    ajaxGET({
      url: 'securityAreas/get/sources',
      authHeader: true,
      async: false,
      successFn: (data) => {
        Object.entries(data).forEach(([code, name]) => {
          const def: string = code === 'original' ? ' selected' : '';
          $('select#game-source').append(`<option value="${code}"${def}>${name}</option>`);
        });
      },
    });
  }

  /**
   * Populate the list of organisation ‘Size’ options when creating a new game.
   *
   * @category Game
   * @category AJAX
   *
   * @todo Make async.
   * @todo Use {@link AjaxService}.
   */
  populateSizeOptions(): void {
    ajaxGET({
      url: 'organisations/get/sizes',
      authHeader: true,
      async: false,
      successFn: (data) => {
        data.forEach((size) => {
          $('select#organisation-size').append(`<option value="${size}">${size}</option>`);

          const numOfAdditionalOrgs = $('#new-organisation-details').children('fieldset').length + 1;

          if (numOfAdditionalOrgs > 1) {
            for (let i = 1; i < numOfAdditionalOrgs; i++) {
              console.debug(`select#organisation-size-${i}`);
              $(`select#organisation-size-${i}`).append(`<option value="${size}">${size}</option>`);
            }
          }
        });
      },
    });
  }

  /**
   * Populate the list of game type radios when creating a new game.
   *
   * @category Game
   * @category AJAX
   *
   * @todo Make async.
   * @todo Use {@link AjaxService}.
   */
  addGameTypeRadios(): void {
    ajaxGET({
      url: 'games/get/gameTypes',
      authHeader: true,
      async: false,
      successFn: (gameTypes: string[]) => {
        let html = '<legend class="form__subtitle">Game Type</legend>';

        for (const [index, gameType] of gameTypes.entries()) {
          html += `<input class="form__control form__input form__input--radio" type="radio" name="game-type" id="${gameType}" value="${index}" ${
            index === 0 ? 'checked' : ''
          }>`;
          html += `<label class="form__label form__label--inline" for="${gameType}">${gameType}</label>`;
          html += `</br>`;
        }

        $('.form__group#game-type').append(html);
      },
    });
  }

  /**
   * Populate the list of organisation ‘Industry’ options when creating a new game.
   *
   * @category Game
   * @category AJAX
   *
   * @todo Make async.
   * @todo Use {@link AjaxService}.
   */
  populateIndustryOptions(): void {
    ajaxGET({
      url: 'organisations/get/industries',
      authHeader: true,
      successFn: (data) => {
        Object.entries(data).forEach(([SIC, industry]) => {
          $('select#organisation-industry').append(`<option value="${SIC}">${SIC}: ${industry}</option>`);

          const numOfAdditionalOrgs = $('#new-organisation-details').children('fieldset').length + 1;

          if (numOfAdditionalOrgs > 1) {
            for (let i = 1; i < numOfAdditionalOrgs; i++) {
              $(`select#organisation-industry-${i}`).append(`<option value="${SIC}">${SIC}: ${industry}</option>`);
            }
          }
        });
      },
    });
  }

  /**
   * Populate the default values for creating a new game.
   *
   * @category Game
   *
   * @async
   */
  async populateDefaultValues(): Promise<void> {
    const {
      size,
      industry,
      startingBalance,
      maxTurns,
      incomePerTurn,
      incidentMinCost,
      incidentMaxCost,
    } = await AjaxService.getGameDefaults();

    $('.form__select#organisation-size').val(size || 'Medium');
    $('.form__select#organisation-industry').val(industry || 'J');
    $('.form__input#organisation-starting-balance').val(startingBalance || 0);
    $('.form__input#game-max-turns').val(maxTurns || 12);
    $('.form__input#game-money-per-turn').val(incomePerTurn || 1000);
    $('.form__input#game-incident-min-cost').val(incidentMinCost || 500);
    $('.form__input#game-incident-max-cost').val(incidentMaxCost || 5000);
  }

  /**
   * Submit a POST request to report an issue.
   *
   * @category Game
   * @category AJAX
   *
   * @todo Make async.
   * @todo Use {@link AjaxService}.
   */
  reportIssue(): void {
    const data = {
      title: $('#issue-summary').val(),
      description: $('#issue-description').val(),
    };

    ajaxPOST({
      url: 'report-issue',
      data,
      authHeader: true,
      successFn: (url: string) => {
        window.alert(`Success!\n\nYou can view your issue at ${url}`);
      },
    });
  }

  /**
   * Submit a POST request to create a new game.
   *
   * @category Game
   * @category AJAX
   *
   * @todo Make async.
   * @todo Use {@link AjaxService}.
   */
  createNewGame(): void {
    const data = {
      newDetails: {
        maxTurns: $('#game-max-turns').val(),
        moneyPerTurn: $('#game-money-per-turn').val(),
        gameType: $('input[name=game-type]:checked').val(),
        source: $('#game-source').val(),
        minCostPerEvent: $('#game-incident-min-cost').val(),
        maxCostPerEvent: $('#game-incident-max-cost').val(),
        showAvailableControls: $('#game-show-available-controls').is(':checked'),
        allowUnavoidableIncidents: $('#game-allow-unavoidable-incidents').is(':checked'),
      },
      newOrganisationDetails: {
        name: $('#organisation-name').val(),
        balance: $('#organisation-starting-balance').val(),
        size: $('#organisation-size').val(),
        industry: $('#organisation-industry').val(),
        joiningCode: $('#organisation-joining-code').val(),
        joiningPassword: $('#organisation-joining-password').val(),
      },
    };

    $.ajax({
      type: 'POST',
      url: `${process.env.API_URL}/games/create`,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      async: false,
      data: JSON.stringify(data),
      contentType: 'application/json',
      xhrFields: {
        withCredentials: true,
      },
      statusCode: {
        201: function (game: Game) {
          localStorage.setItem('game', JSON.stringify(game));
        },
        409: function () {
          window.alert('Joining code already in use');
        },
      },
    });

    const game: Game = JSON.parse(localStorage.getItem('game'));
    if (game.gameType === GameType.Competitive) this.addOrganisations(game.id);

    redirect('game');
  }

  /**
   * Submit a PATCH request to add additional organisation(s) to an existing game.
   *
   * @category Game
   * @category AJAX
   *
   * @param  gameID  The ID of the game to add the organisation(s) to.
   *
   * @todo Make async.
   * @todo Use {@link AjaxService}.
   * @todo Validate data (e.g., no duplicate joining codes, handle server return codes.
   */
  addOrganisations(gameId: string): void {
    const numOfAdditionalOrgs = $('#new-organisation-details').children('fieldset').length + 1;

    if (numOfAdditionalOrgs > 1) {
      for (let i = 1; i < numOfAdditionalOrgs; i++) {
        const data = {
          gameId,
          organisation: {
            name: $(`#organisation-name-${i}`).val(),
            balance: $(`#organisation-starting-balance-${i}`).val(),
            size: $(`#organisation-size-${i}`).val(),
            industry: $(`#organisation-industry-${i}`).val(),
            joiningCode: $(`#organisation-joining-code-${i}`).val(),
            joiningPassword: $(`#organisation-joining-password-${i}`).val(),
          },
          ownerUsername: $(`#organisation-owner-${i}`).val(),
        };

        $.ajax({
          type: 'PATCH',
          url: `${process.env.API_URL}/games/add/organisation`,
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          async: false,
          data: JSON.stringify(data),
          contentType: 'application/json',
          xhrFields: {
            withCredentials: true,
          },
          statusCode: {
            200: function () {
              console.debug(`Org #${i} added successfully`);
            },
          },
        });
      }
    }
  }

  /**
   * Submit a PATCH request to join an existing game.
   *
   * @category Game
   * @category AJAX
   *
   * @todo Make async.
   * @todo Use {@link AjaxService}.
   */
  joinGame(): void {
    const data = {
      joiningCode: $('#organisation-joining-code').val(),
      joiningPassword: $('#organisation-joining-password').val(),
    };

    ajaxPATCH({
      url: 'games/join',
      data,
      authHeader: true,
      successFn: (game: Game) => {
        localStorage.setItem('gameId', game.id);
        redirect('game');
      },
    });
  }

  /**
   * Render the form fields for an additional organisation.
   *
   * @category Game
   * @category Multiplayer
   *
   * @param  idx  The index of the new organisation.
   * @return  The HTML form fields.
   */
  private _addOrganisationFormFields(idx: number): string {
    let html = `<fieldset class="form__group" id="additional-organisations-${idx}">`;

    html += `<h3 class="form__subtitle">Additional Organisation #${idx}</h3>`;
    html += `<label class="form__label form__label--above" for="organisation-name-${idx}">Organisation Name</label>`;
    html += `<input class="form__control form__input--text" type="text" name="organisation-name-${idx}" id="organisation-name-${idx}" placeholder="Foo Corp." required autofocus>`;

    html += `<label class="form__label form__label--above" for="organisation-size-${idx}">Size</label>`;
    html += `<select class="form__control form__select" name="organisation-size-${idx}" id="organisation-size-${idx}">`;
    html += `</select>`;

    html += `<label class="form__label form__label--above" for="organisation-industry-${idx}">Industry</label>`;
    html += `<select class="form__control form__select" name="organisation-industry-${idx}" id="organisation-industry-${idx}">`;
    html += `</select>`;

    html += `<label class="form__label form__label--above" for="organisation-starting-balance-${idx}">Starting Balance <span class="label__note label__note--inline">(&pound;)</span></label>`;
    html += `<input class="form__control form__input form__input--number form__input--currency" type="number" name="organisation-starting-balance-${idx}" id="organisation-starting-balance-${idx}" min="0" max="10000" step="0" value="0">`;

    html += `<label class="form__label form__label--above" for="organisation-joining-code-${idx}">Owner</label>`;
    html += `<input class="form__control form__input--text" type="email" name="organisation-owner-${idx}" id="organisation-owner-${idx}" required>`;

    html += `<label class="form__label form__label--above" for="organisation-joining-code-${idx}">Joining Code</label>`;
    html += `<input class="form__control form__input--text" type="text" name="organisation-joining-code-${idx}" id="organisation-joining-code-${idx}" required>`;

    html += `<label class="form__label form__label--above" for="organisation-joining-password-${idx}" class="optional">Joining Password</label>`;
    html += `<input class="form__control form__input--text" type="text" name="organisation-joining-password-${idx}" id="organisation-joining-password-${idx}">`;

    html += '</fieldset>';

    return html;
  }
}
