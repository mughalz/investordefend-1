/**
 * This module defines the co-operative game services, which add all additional
 * functionality required for running a co-operative game.
 *
 * These services only handle game logic and rendering.
 * For game management (e.g., initialising and exiting games, see {@link GameService}.
 * For game administration (e.g., creating new games), see {@link GameAdminService}.
 *
 * @category Game
 * @category Multiplayer
 * @category Services
 *
 * @module CooperativeGameService
 */

import $, { JQuery } from 'jquery';

import { BaseMultiplayerGameService } from './baseGame.service';
import { BaseMultiPlayerRenderingService } from './baseRendering.service';
import { ajaxPATCH, GameState, GameType } from '../_helpers';
import { Game, GameSettings, Control, Asset, ThreatActor, SecurityArea, Votes, VoteSummary } from '../types/typings.d';

/**
 * The game type for this service.
 *
 * @var GameType
 */
const GAME_TYPE = GameType.Cooperative;

/**
 * The default mode for viewing controls in-game.
 *
 * @var string
 */
const DEFAULT_CONTROL_VIEW_MODE = 'tiles';

/**
 * Represents the co-operative game service.
 *
 * @category Game
 * @category Multiplayer
 * @category Services
 */
export class CooperativeGameService extends BaseMultiplayerGameService {
  /**
   * The ongoing vote tallies for the game.
   */
  public _votes: Votes[];

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

    this._renderingService.renderSimulateButton(this.state, this._getVoteSummaries());

    this._addPoll('simulate-turn', this._renderingService.renderSimulateButton, [this.state, this._getVoteSummaries()]);
  }

  /****************************************************************************
   * Event handlers.
   ****************************************************************************/

  /**
   * Vote to simulate a new turn.
   *
   * @category Game
   * @category Multiplayer
   *
   * @param event  Optional. The calling event.
   */
  protected _handleClickSimulateTurn(event?: JQuery.Event): void {
    const voteIndex = this._toggleVote(event.target.id);

    // Update the rendered object
    this._renderingService.renderSimulateButton(this.state, this._getVoteSummaries());

    // If the vote threshold has been reached, trigger the callback.
    if (this._getVoteTally(voteIndex) >= this._getVoteThreshold()) {
      this._deleteVotes();
      super._handleClickSimulateTurn();
    }
  }

  /**
   * Start polling for control voting.
   *
   * @category Game
   * @category Multiplayer
   *
   * @param mode  The control view mode. `DEFAULT_CONTROL_VIEW_MODE`.
   * @param makeRequest  If `false`, uses cached values. Default `true`.
   *
   * @todo Remove duplicate call to `this._renderingService.renderAvailableControlsModal()`.
   */
  protected _handleClickViewAvailableControls(mode = DEFAULT_CONTROL_VIEW_MODE): void {
    this._renderingService.renderAvailableControlsModal(
      this.newControls,
      this.controlsToImplement,
      this.spendAvailable,
      mode,
      this._getVoteSummaries(),
    );

    this._addPoll('new-controls', this._handleClickViewAvailableControls, [mode, false]);
  }

  /**
   * Vote to stage a control for implementation.
   *
   * @category Game
   * @category Multiplayer
   *
   * @param event  The calling event.
   */
  protected _handleClickImplementControl(event: JQuery.Event): void {
    const voteIndex = this._toggleVote(event.target.id);

    // Update the rendered object
    this._renderingService.renderAvailableControlsModal(
      this.newControls,
      this.controlsToImplement,
      this.spendAvailable,
      $(event.target).parents('.modal__content').hasClass('modal__content--tiles') ? 'tiles' : 'table',
      this._getVoteSummaries(),
    );

    // If the vote threshold has been reached, trigger the callback.
    if (this._getVoteTally(voteIndex) >= this._getVoteThreshold()) {
      this._deleteVotes(event.target.id);
      super._handleClickImplementControl(event);
    }
  }

  /**
   * Vote to de-stage a control from implementation.
   *
   * @category Game
   * @category Multiplayer
   *
   * @param event  The calling event.
   */
  protected _handleClickRemoveControl(event: JQuery.Event): void {
    const voteIndex = this._toggleVote(event.target.id);

    // Update the rendered object
    this._renderingService.renderAvailableControlsModal(
      this.newControls,
      this.controlsToImplement,
      this.spendAvailable,
      $(event.target).parents('.modal__content').hasClass('modal__content--tiles') ? 'tiles' : 'table',
      this._getVoteSummaries(),
    );

    // If the vote threshold has been reached, trigger the callback.
    if (this._getVoteTally(voteIndex) >= this._getVoteThreshold()) {
      this._deleteVotes(event.target.id);
      super._handleClickRemoveControl(event);
    }
  }

  /****************************************************************************
   * Voting.
   ****************************************************************************/

  /**
   * Summaries votes for passing to the rendering service.
   *
   * @category Game
   * @category Multiplayer
   *
   * @return  The vote summary.
   */
  protected _getVoteSummaries(): VoteSummary {
    return {
      votes: this._votes.map((element) => {
        return {
          id: element.id,
          votes: element.votes.length,
          hasVoted: !!element.votes.find((voterId) => {
            return voterId === this._userId;
          }),
        };
      }),
      threshold: this._getVoteThreshold(),
    };
  }

  /**
   * Cast or revoke a vote.
   *
   * @category Game
   * @category Multiplayer
   *
   * @param voteId  The ID of the vote to toggle (e.g., a control button element ID).
   * @return  The index of the vote, or -1 if a vote has been revoked.
   */
  protected _toggleVote(voteId: string): number {
    let voteIndex: number;

    voteIndex = this._votes.findIndex((vote) => {
      return vote.id === voteId;
    });

    if (voteIndex === -1) {
      voteIndex = this._votes.length;
      this._votes.push({ id: voteId, votes: [this._userId] });
      this._updateVotes();
    } else {
      if (!(this._votes[voteIndex].votes.length >= this._getVoteThreshold())) {
        const userVoteIdx = this._votes[voteIndex].votes.findIndex((voterId) => {
          return voterId === this._userId;
        });

        if (userVoteIdx !== -1) {
          this._votes[voteIndex].votes = this._votes[voteIndex].votes.filter((voterId) => {
            return voterId !== this._userId;
          });
          if (!this._votes[voteIndex].votes.length) this._votes.splice(voteIndex, 1);
        } else {
          this._votes[voteIndex].votes.push(this._userId);
        }

        this._updateVotes();
      }
    }

    return voteIndex;
  }

  /****************************************************************************
   * Netcode.
   ****************************************************************************/

  /**
   * Checks for passing votes before polling.
   *
   * @category Game
   * @category Multiplayer
   */
  protected _poll(): void {
    this._checkPassingVotes();

    super._poll();
  }

  /**
   * Send the current vote tallies to the server.
   *
   * @category Game
   * @category Multiplayer
   * @category AJAX
   *
   * @todo Make async
   * @todo Use {@link AjaxService}.
   */
  protected _updateVotes(): void {
    const data = {
      updatedDetails: {
        id: this._id,
        votes: this._votes,
      },
    };

    ajaxPATCH({
      url: 'games/update',
      data,
      authHeader: true,
      successFn: (updatedGame) => {
        localStorage.setItem('game', JSON.stringify(updatedGame));
      },
    });
  }

  /**
   * Delete a set of ongoing votes or all votes.
   *
   * @category Game
   * @category Multiplayer
   *
   * @param voteId  Optional. The ID of the vote to delete. If empty, then delete all.
   */
  protected _deleteVotes(voteId?: string): void {
    if (voteId) {
      const voteIndex = this._votes.findIndex((vote) => {
        return vote.id == voteId;
      });
      if (voteIndex !== -1) this._votes.splice(voteIndex, 1);
      else console.debug('Vote already removed');
    } else this._votes = [];
  }

  /**
   * Checks for any passing votes and executes them.
   *
   * @category Game
   * @category Multiplayer
   */
  protected _checkPassingVotes(): void {
    for (const vote of this._votes) {
      if (vote.votes.length >= this._getVoteThreshold()) {
        console.debug(`Vote threshold reached, clicking on #${vote.id}`);
        $(`#${vote.id}`).click();

        if (vote.id === 'simulate-turn') this._deleteVotes();
        else this._deleteVotes(vote.id);

        this._updateVotes();
      }
    }
  }

  /**
   * Calculates the vote threshold for a co-operative game.
   *
   * @category Game
   * @category Multiplayer
   *
   * @return  The vote threshold required for an action to pass.
   */
  protected _getVoteThreshold(): number {
    return Math.ceil(this.organisation.members.length / 2);
  }

  /**
   * Calculates the current tally for a given vote.
   *
   * @category Game
   * @category Multiplayer
   *
   * @param voteIndex  The array index of the vote to tally.
   * @return  The vote tally.
   */
  protected _getVoteTally(voteIndex: number): number {
    return this._votes[voteIndex].votes.length;
  }

  /****************************************************************************
   * Configuration.
   ****************************************************************************/

  /**
   * Updates the local vote tally.
   *
   * @category Game
   * @category Multiplayer
   *
   * @param game  The game state object
   */
  protected _updateLocalGameState(game: Game): void {
    super._updateLocalGameState(game);
    this._votes = game.votes;
  }
}

/**
 * Represents the co-operative game rendering service.
 *
 * @category Game
 * @category Multiplayer
 * @category Services
 */
export class CooperativeRenderingService extends BaseMultiPlayerRenderingService {
  /**
   * Hides the ‘View Orgs’ button.
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

    $('button#view-orgs').hide();
  }

  /**
   * Displays vote tallies on the ‘Implement/Remove Control’ buttons.
   *
   * @category Game
   * @category Multiplayer
   *
   * @param newControls  The controls to display.
   * @param controlsToImplement  Controls staged to be implemented.
   * @param spendAvailable  The amount of money left for the player to spend.
   * @param mode  The display mode to use.
   * @param votes  Optional. The current votes and required threshold.
   */
  renderAvailableControlsModal(
    newControls: Control[],
    controlsToImplement: string[],
    spendAvailable: number,
    mode: string,
    votes?: VoteSummary,
  ): void {
    super.renderAvailableControlsModal(newControls, controlsToImplement, spendAvailable, mode);

    $('.button--implement-control, .button--remove-control').each((_, button) => {
      let numOfVotes: number;
      let hasVotedTag: string;

      const voteIndex = votes.votes.findIndex((element) => {
        return element.id === button.id;
      });
      if (voteIndex !== -1) {
        numOfVotes = votes.votes[voteIndex].votes;
        hasVotedTag = votes.votes[voteIndex].hasVoted ? ' *' : '';
      } else {
        numOfVotes = 0;
        hasVotedTag = '';
      }

      const buttonText = button.classList.contains('button--implement-control') ? 'Implement' : 'Remove';

      $(button).html(`${buttonText} (${numOfVotes || 0}/${votes.threshold})${hasVotedTag}`);
    });
  }

  /**
   * Displays the vote tally on the ‘Simulate Turn’ button.
   *
   * @category Game
   * @category Base
   *
   * @param state  The current state of the game.
   * @param votes  Optional. The current votes and required threshold.
   */
  renderSimulateButton(state: GameState, votes?: VoteSummary): void {
    super.renderSimulateButton(state);

    if (votes) {
      if (state === GameState.Purchasing) {
        const button = $('.button#simulate-turn');

        const voteIndex: number = votes.votes.findIndex((element) => {
          return element.id === button.attr('id');
        });
        let numOfVotes: number;
        let hasVotedTag: string;

        if (voteIndex !== -1) {
          numOfVotes = votes.votes[voteIndex].votes;
          hasVotedTag = votes.votes[voteIndex].hasVoted ? ' *' : '';
        } else {
          numOfVotes = 0;
          hasVotedTag = '';
        }

        $(button).html(`Simulate Turn (${numOfVotes || 0}/${votes.threshold})${hasVotedTag}`);
      }
    }
  }
}
