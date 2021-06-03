/**
 * This module defines the game service, which processes all requests relating
 * to game management.
 *
 * This service only handles game management. For game logic, see {@link BaseGameService}.
 * For game rendering, see {@link BaseRenderingService}.
 * For game administration (e.g., creating new games), see {@link GameAdminService}.
 *
 * @category Game
 * @category Services
 *
 * @module GameService
 */

import $ from 'jquery';

import { ajaxGET, redirect, GameState, GameType, AssetLocations } from './_helpers';
import { Game, Asset, ThreatActor, SecurityArea } from './types/typings.d';
import { SinglePlayerGameService, CooperativeGameService, CompetitiveGameService } from './gameServices';

/**
 * Represents the game service.
 *
 * @category Game
 * @category Services
 */
export default class GameService {
  /****************************************************************************
   * Child services.
   ****************************************************************************/

  /**
   * The service that handles the game logic.
   */
  private _gameService;

  /****************************************************************************
   * Item IDs.
   ****************************************************************************/

  /**
   * The logged-in user's ID.
   *
   * @todo  Derive from JWT?
   * @todo  Type as ObjectId.
   */
  private _userId: string;

  /****************************************************************************
   * Game settings.
   ****************************************************************************/

  /**
   * The server-provided game settings.
   */
  private _settings = {
    assets: [],
    threatActors: [],
    securityAreas: [],
    tutorials: [],
  };

  /**
   * Starts the appropriate game service.
   *
   * @category Game
   */
  constructor() {
    // TODO: race condition, need to replace with callback returns/`await`.
    this._getGameDetails(localStorage.getItem('gameId') || JSON.parse(localStorage.getItem('game'))['id']);
    const game: Game = JSON.parse(localStorage.getItem('game'));

    if (game) {
      localStorage.removeItem('gameId');
      this._userId = localStorage.getItem('userId');

      this._getGameSettings();

      switch (game.gameType) {
        case GameType.SinglePlayer:
          this._gameService = new SinglePlayerGameService(this._userId, game, this._settings);
          break;
        case GameType.Cooperative:
          this._gameService = new CooperativeGameService(this._userId, game, this._settings);
          break;
        case GameType.Competitive:
          this._gameService = new CompetitiveGameService(this._userId, game, this._settings);
          break;
        default:
          throw 'Unknown game type!';
      }

      $('.button--exit').click(() => {
        this._exitGame();
      });

      this._gameService.handleFinishLoading();

      this._showNewUserTutorial();
    } else throw 'No game data found';
  }

  /**
   * Shows the new user tutorial modal if it hasn't been shown to the user yet.
   *
   * @category Game
   */
  private _showNewUserTutorial(): void {
    if (!localStorage.getItem('tutorial-viewed')) {
      this._gameService.showNewUserTutorial();
      localStorage.setItem('tutorial-viewed', 'true');
    }
  }

  /**
   * Quits the game.
   *
   * @category Game
   */
  private _exitGame(): void {
    localStorage.removeItem('game');
    localStorage.removeItem('gameId');
    redirect('main-menu');
  }

  /**
   * Gets all server-defined game settings.
   *
   * @category Game
   * @category AJAX
   *
   * @see GameService._settings
   *
   * @todo Make async
   * @todo Use {@link AjaxService}.
   */
  private _getGameSettings(): void {
    ajaxGET({
      url: `games/get/setting/assets`,
      authHeader: true,
      async: false,
      successFn: ({ value: assets }: { value: Asset[] }) => {
        this._settings.assets = assets;
        this._settings.assets.push(AssetLocations.organisation);
        this._settings.assets.push(AssetLocations.internet);
      },
    });

    ajaxGET({
      url: `games/get/setting/tutorials`,
      authHeader: true,
      async: false,
      successFn: ({ value: tutorials }: { value: { state: GameState | null; text: string }[] }) => {
        this._settings.tutorials = tutorials;
      },
    });

    ajaxGET({
      url: `games/get/setting/threatActors`,
      authHeader: true,
      async: false,
      successFn: ({ value: threatActors }: { value: ThreatActor[] }) => {
        this._settings.threatActors = threatActors;
        for (const threatActor of this._settings.threatActors) {
          if (threatActor.includeFrom) threatActor.includeWarningShown = false;
        }
      },
    });

    ajaxGET({
      url: `securityAreas`,
      authHeader: true,
      async: false,
      successFn: (securityAreas: SecurityArea[]) => {
        this._settings.securityAreas = securityAreas;
      },
    });
  }

  /**
   * Gets details of the current game.
   *
   * @category Game
   * @category AJAX
   *
   * @param id  The ID of the current game.
   *
   * @todo Make async
   * @todo Use {@link AjaxService}.
   */
  protected _getGameDetails(id: string): void {
    if (id) {
      ajaxGET({
        url: `games/${id}`,
        authHeader: true,
        async: false,
        successFn: (game: Game) => {
          localStorage.setItem('game', JSON.stringify(game));
        },
      });
    } else throw 'No game ID!';
  }
}
