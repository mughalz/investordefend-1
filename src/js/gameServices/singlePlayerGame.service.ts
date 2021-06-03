/**
 * This module defines the single-player game service, which add all additional
 * functionality required for running a single-player game.
 *
 * These services only handle game logic and rendering.
 * For game management (e.g., initialising and exiting games, see {@link GameService}.
 * For game administration (e.g., creating new games), see {@link GameAdminService}.
 *
 * @category Game
 * @category SinglePlayer
 * @category Services
 *
 * @module SinglePlayerGameService
 */

import $ from 'jquery';

import { BaseGameService } from './baseGame.service';
import { BaseRenderingService } from './baseRendering.service';
import { GameType } from '../_helpers';
import { Game, GameSettings, Asset, ThreatActor, SecurityArea } from '../types/typings.d';

/**
 * The game type for this service.
 *
 * @var string
 */
const GAME_TYPE = GameType.SinglePlayer;

/**
 * Represents the single-player game service.
 *
 * @category Game
 * @category SinglePlayer
 * @category Services
 */
export class SinglePlayerGameService extends BaseGameService {
  /**
   * Passes the game type to the superclass.
   *
   * @category Game
   * @category SinglePlayer
   */
  constructor(userId: string, game: Game, settings: GameSettings) {
    super(userId, game, settings, GAME_TYPE);
  }
}

/**
 * Represents the single-player game rendering service.
 *
 * @category Game
 * @category SinglePlayer
 * @category Services
 */
export class SinglePlayerRenderingService extends BaseRenderingService {
  /**
   * Hides the ‘View Players’ and ‘View Orgs’ buttons.
   *
   * @category Game
   * @category SinglePlayer
   *
   * @param assets  The server-defined list of assets.
   * @param threatActors  The server-defined list of threat actors.
   * @param securityAreas  The server-defined list of security areas.
   */
  constructor(assets: Asset[], threatActors: ThreatActor[], securityAreas: SecurityArea[]) {
    super(assets, threatActors, securityAreas, GAME_TYPE);

    $('button#view-players').hide();
    $('button#view-orgs').hide();
  }
}
