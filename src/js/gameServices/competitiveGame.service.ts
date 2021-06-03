/**
 * This module defines the competitive game services, which add all additional
 * functionality required for running a competitive game.
 *
 * These services only handle game logic and rendering.
 * For game management (e.g., initialising and exiting games, see {@link GameService}.
 * For game administration (e.g., creating new games), see {@link GameAdminService}.
 *
 * @category Game
 * @category Multiplayer
 * @category Services
 *
 * @module CompetitiveGameService
 */

import $, { JQuery } from 'jquery';

import { BaseMultiplayerGameService } from './baseGame.service';
import { BaseMultiPlayerRenderingService } from './baseRendering.service';
import { ajaxGET, ajaxPOST, GameState, GameType } from '../_helpers';
import { Organisation, Game, GameSettings, Asset, ThreatActor, SecurityArea } from '../types/typings.d';

/**
 * The game type for this service.
 *
 * @var GameType
 */
const GAME_TYPE = GameType.Competitive;

/**
 * Represents the co-operative game service.
 *
 * @category Game
 * @category Multiplayer
 * @category Services
 */
export class CompetitiveGameService extends BaseMultiplayerGameService {
  protected _readyOrganisations: string[];

  protected _otherOrganisations: Organisation[];

  /**
   * Sets up vote polling for the ‘Simulate Turn’ button.
   *
   * @category Game
   * @category Multiplayer
   *
   * @param userId  The ID of the logged-in user.
   * @param game  The current game.
   * @param settings  The server-defined game settings.
   */
  constructor(userId: string, game: Game, settings: GameSettings) {
    super(userId, game, settings, GAME_TYPE);

    this._renderingService.renderSimulateButton(this.state, this._isReady());
  }

  /****************************************************************************
   * Event handlers.
   ****************************************************************************/

  /**
   * Registers any competitive-only event handlers.
   *
   * @category Game
   * @category Multiplayer
   * @category jQuery
   */
  protected _registerEventHandlers(): void {
    super._registerEventHandlers();

    $('button#view-orgs').click(() => {
      this._handleClickShowOrgs();
    });

    $('.modal#org-history').on('click', '.button--view-org-history', (event: JQuery.Event) => {
      const idx = Number($(event.target).attr('id').split('-')[2]);
      this._handleClickViewHistory(idx === 0 ? this.organisation.id : this._otherOrganisations[idx - 1].id);
    });
  }

  /**
   * Displays the organisations in the game.
   *
   * @category Game
   * @category Multiplayer
   * @category AJAX
   *
   * @todo Make async
   * @todo Use {@link AjaxService}.
   */
  protected _handleClickShowOrgs(): void {
    ajaxGET({
      url: `games/${this._id}/get/organisations`,
      authHeader: true,
      successFn: (organisations: Organisation[]) => {
        let names = '';
        for (const organisation of organisations) {
          names += `- ${organisation.name}\n`;
        }
        alert(`Organisations:\n\n${names}`);
      },
    });
  }

  /**
   * Displays the organisation's historical balance throughout the game.
   *
   * Does NOT call the super class (yet).
   *
   * @category Game
   * @category Multiplayer
   * @category AJAX
   *
   * @param organisationId  The ID of the organisation to view the history of.
   *
   * @todo Make async
   * @todo Use {@link AjaxService}.
   */
  protected _handleClickViewHistory(organisationId: string): void {
    ajaxGET({
      url: `organisations/${organisationId}/get/pastBalances`,
      authHeader: true,
      successFn: (balances: number[]) => {
        let currIdx: number;

        if (organisationId === this.organisation.id) {
          balances.push(this.organisation.balance);
          currIdx = 0;
        } else {
          currIdx = this._otherOrganisations.findIndex((organisation) => {
            return organisation.id === organisationId;
          });
          balances.push(this._otherOrganisations[currIdx].balance);
          currIdx++;
        }

        this._renderingService.renderHistoryModal(balances, this.organisation, this._otherOrganisations, currIdx);
      },
    });
  }

  /****************************************************************************
   * Voting.
   ****************************************************************************/

  /**
   * Checks if the logged-in user's organisation has set itself as ready to
   * simulate the next turn or not.
   *
   * @category Game
   * @category Multiplayer
   *
   * @return  Whether the logged-in organisation is declared ready or not.
   */
  protected _isReady(): boolean {
    return !!this._readyOrganisations.find((organisationId) => {
      return organisationId === this.organisation.id;
    });
  }

  /****************************************************************************
   * Gameplay.
   ****************************************************************************/

  /**
   * Sends a POST request to simulate the next turn.
   *
   * Locks in control implementation choices, updates values accordingly and
   * waits for a response from the server.
   *
   * Does NOT call the super class.
   *
   * @category Game
   * @category Multiplayer
   * @category AJAX
   *
   * @todo Make async
   * @todo Use {@link AjaxService}.
   */
  protected _simulateTurn(): void {
    const data = {
      gameId: this._id,
      organisationId: this.organisation.id,
    };

    const numOfReady = this._readyOrganisations.length;

    ajaxPOST({
      url: 'games/simulate-turn',
      data,
      authHeader: true,
      successFn: (updatedGame) => {
        localStorage.setItem('game', JSON.stringify(updatedGame));

        this._readyOrganisations = updatedGame.readyOrganisations;

        this._renderingService.renderSimulateButton(this.state, this._isReady());

        if (numOfReady < this._otherOrganisations.length) {
          this._addPoll('simulate-turn', this._checkReadyToSimulateTurn, [this.currentTurn]);
        } else {
          this.currentTurn = updatedGame.currentTurn;
          this.state = updatedGame.state;
          this.organisation = updatedGame.organisations.find((organisation) => {
            return organisation.members.includes(this._userId);
          });
          this._otherOrganisations = updatedGame.organisations.filter((organisation) => {
            return !organisation.members.includes(this._userId);
          });
          this._readyOrganisations = [];

          this._renderGameState(GameState.Results);
        }
      },
    });
  }

  /**
   * Checks to see if all players have requested a new turn.
   *
   * @category Game
   * @category Multiplayer
   *
   * @param  currentTurn  The turn number when the callback was registered.
   */
  protected _checkReadyToSimulateTurn(currentTurn: number): void {
    if (this.currentTurn > currentTurn) {
      this._removePoll('simulate-turn');
      this._renderGameState(GameState.Simulating);
      this._renderGameState(GameState.Results);
    }
  }

  /****************************************************************************
   * Configuration.
   ****************************************************************************/

  /**
   * Updates the local log of ready organisations.
   *
   * @category Game
   * @category Multiplayer
   *
   * @param game  The game state object
   */
  protected _updateLocalGameState(game: Game): void {
    super._updateLocalGameState(game);

    this.organisation = game.organisations.find((organisation) => {
      return organisation.members.includes(this._userId);
    });
    this._otherOrganisations = game.organisations.filter((organisation) => {
      return !organisation.members.includes(this._userId);
    });
    this._readyOrganisations = game.readyOrganisations;
  }
}

/**
 * Represents the competitive game rendering service.
 *
 * @category Game
 * @category Multiplayer
 * @category Services
 */
export class CompetitiveRenderingService extends BaseMultiPlayerRenderingService {
  /**
   * Sets the game type.
   *
   * @category Game
   * @category Multiplayer
   *
   * @param assets  The server-defined list of assets.
   * @param threatActors  The server-defined list of threat actors.
   * @param securityAreas  The server-defined list of security areas.
   */
  constructor(assets: Asset[], threatActors: ThreatActor[], securityAreas: SecurityArea[]) {
    super(assets, threatActors, securityAreas, GAME_TYPE);
  }

  /**
   * Displays the state of the ‘Simulate Turn’ button.
   *
   * @category Game
   * @category Multiplayer
   *
   * @param state  The current state of the game.
   * @param votes  Optional. The current votes and required threshold.
   */
  renderSimulateButton(state: GameState, isReady?: boolean): void {
    super.renderSimulateButton(state);

    if (isReady) {
      $('.button#simulate-turn').attr('disabled', true);
      $('.button#simulate-turn').html(`Awaiting other players...`);
    }
  }

  /**
   * Displays the historical organisation balances in a modal.
   *
   * @category Game
   * @category Base
   *
   * @param balances  The balance values of the organisation over time.
   */
  renderHistoryModal(
    balances: number[],
    organisation: Organisation,
    otherOrganisations?: Organisation[],
    currIdx?: number,
  ): void {
    super.renderHistoryModal(balances, currIdx === 0 ? organisation : otherOrganisations[currIdx - 1]);

    if (otherOrganisations.length > 0) {
      $('.button--view-org-history').remove();

      for (let i = otherOrganisations.length; i > 0; i--) {
        const orgButton = $(
          `<button class="button modal__button button--view-org-history" id="org-history-${i}">${
            otherOrganisations[i - 1].name
          }</button>`,
        );

        $('.modal#org-history .modal__title').after(orgButton);
      }

      const myOrgButton = $(
        `<button class="button modal__button button--view-org-history" id="org-history-0">${organisation.name}</button>`,
      );
      $('.modal#org-history .modal__title').after(myOrgButton);
    }
  }
}
