/**
 * This module defines the base game services, which all game type-specific
 * services will extend.
 *
 * These services only handle game logic. For rendering, see {@link BaseRenderingServices}.
 * For game management (e.g., initialising and exiting games, see {@link GameService}.
 * For game administration (e.g., creating new games), see {@link GameAdminService}.
 *
 * @category Game
 * @category Base
 * @category Services
 *
 * @module BaseGameServices
 */

import $, { JQuery } from 'jquery';

import { ajaxGET, ajaxPOST, ajaxPATCH, GameState, GameType, AssetLocations, formatter } from '../_helpers';
import {
  Organisation,
  User,
  Game,
  GameSettings,
  Polls,
  Control,
  Asset,
  ThreatActor,
  SecurityArea,
} from '../types/typings.d';
import {
  SinglePlayerRenderingService,
  CooperativeRenderingService,
  CompetitiveRenderingService,
} from '../gameServices';

/**
 * The default mode for viewing controls in-game.
 *
 * @var string
 */
const DEFAULT_CONTROL_VIEW_MODE = 'tiles';

/**
 * Represents the base game service.
 *
 * @category Game
 * @category Base
 * @category Services
 */
export abstract class BaseGameService {
  /****************************************************************************
   * Child services.
   ****************************************************************************/

  /**
   * The service that handles rendering the game.
   */
  protected _renderingService;

  /**
   * The game type of the game.
   */
  protected _gameType: GameType;

  /****************************************************************************
   * Item IDs.
   ****************************************************************************/

  /**
   * The logged-in user's ID.
   *
   * @todo  Derive from JWT?
   * @todo  Type as ObjectId.
   */
  protected _userId: string;

  /**
   * The ObjectID of the current game.
   */
  protected _id: string;

  /****************************************************************************
   * Game settings.
   ****************************************************************************/

  /**
   * The assets to which controls and events can be assigned.
   */
  protected _assets: Asset[];

  /**
   * The threat actors to which events can be attributed.
   */
  protected _threatActors: ThreatActor[];

  /**
   * The security areas by which controls and events can be classified.
   */
  protected _securityAreas: SecurityArea[];

  /**
   * The tutorial tooltips for each stage of the game.
   */
  protected _tutorials: { state: GameState | null; text: string }[];

  /****************************************************************************
   * Game details.
   ****************************************************************************/

  /**
   * The current state of the game.
   */
  protected state: GameState;

  /**
   * The current game turn.
   */
  protected currentTurn: number;

  /**
   * The maximum number of turns in the current game.
   */
  protected maxTurns: number;

  /**
   * The amount of money the organisation receives.
   *
   * This is the amount given to invest in controls, the remainder of which is
   * then added onto the organisation's balance/score.
   */
  protected moneyPerTurn: number;

  /**
   * Whether to show available controls or not.
   */
  protected showAvailableControls: boolean;

  /**
   * The details of the player's organisation.
   */
  protected organisation: Organisation;

  /**
   * The amount of money available to the player to spend on controls.
   */
  protected spendAvailable: number;

  /**
   * The amount of money allocated by the player to spend on controls.
   */
  protected spendAllocated: number;

  /**
   * All of the controls that the player has yet to implement.
   */
  protected newControls: Control[];

  /**
   * The controls that the player has staged to implement this turn.
   */
  protected controlsToImplement: string[] = []; // Actually `Types.ObjectId`.

  /**
   * The control that the player is currently placing on an asset.
   */
  protected _placingControl: Control; // Ditto.

  /*eslint-disable @typescript-eslint/ban-types */
  /**
   * The list of implemented control effects, to run at the start of each new
   * turn.
   */
  protected _controlEffects: Function[] = [];
  /*eslint-enable @typescript-eslint/ban-types */

  /**
   * Retrieves and stores game data, starts the rendering service and registers
   * required jQuery callbacks.
   *
   * @category Game
   * @category Base
   *
   * @param userId  The ID of the logged-in user.
   * @param game  The current game.
   * @param settings  The server-defined game settings.
   * @param gameType  The current game type (passed by each sub-class).
   *
   * @todo  I don't like that the rendering service handling breaks encapsulation,
   *        but I can't think of a better way to handle it.
   */
  constructor(userId: string, game: Game, settings: GameSettings, gameType: GameType) {
    localStorage.removeItem('gameId');

    this._userId = localStorage.getItem('userId');

    this._setGameSettings(settings);

    if (gameType === undefined) throw 'No game type found.';
    if (!Object.values(GameType).includes(gameType)) throw 'Invalid game type.';
    this._gameType = gameType;

    //
    switch (this._gameType) {
      case GameType.SinglePlayer:
        this._renderingService = new SinglePlayerRenderingService(
          this._assets,
          this._threatActors,
          this._securityAreas,
        );
        break;
      case GameType.Cooperative:
        this._renderingService = new CooperativeRenderingService(this._assets, this._threatActors, this._securityAreas);
        break;
      case GameType.Competitive:
        this._renderingService = new CompetitiveRenderingService(this._assets, this._threatActors, this._securityAreas);
        break;
      default:
        throw 'Unknown game type!';
    }

    this._updateLocalGameState(game);

    this._registerEventHandlers();

    this._renderingService.renderOrganisationName(this.organisation.name);
    this._renderGameState(this.state);
  }

  /****************************************************************************
   * Event handlers.
   ****************************************************************************/

  /**
   * Registers all event handlers.
   *
   * @category Game
   * @category Base
   * @category jQuery
   */
  protected _registerEventHandlers(): void {
    $('button#view-history').click(() => {
      this._handleClickViewHistory(this.organisation.id);
    });

    $('button#view-implemented-controls').click(() => {
      this._handleClickViewImplementedControls(DEFAULT_CONTROL_VIEW_MODE);
    });
    $('button#view-new-controls').click(() => {
      this._handleClickViewAvailableControls(DEFAULT_CONTROL_VIEW_MODE);
    });

    $('button#simulate-turn').click(() => {
      this._handleClickSimulateTurn();
    });

    $('.modal').on('click', '.button--change-view-mode', (event: JQuery.Event) => {
      this._handleClickChangeViewMode(event);
    });

    $('table').on('click', '.button--view-event', (event: JQuery.Event) => {
      this._handleClickViewEvent(event);
    });

    $('.modal').on('click', '.button--implement-control', (event: JQuery.Event) => {
      this._handleClickImplementControl(event);
    });

    $('.modal').on('click', '.button--remove-control', (event: JQuery.Event) => {
      this._handleClickRemoveControl(event);
    });

    $('.game__display').on('click', '.asset__icon', (event: JQuery.Event) => {
      this._handleClickAssetIcon(event);
    });

    $('.modal#control-placement').on('click', '.tile', (event: JQuery.Event) => {
      this._handleClickPlacableControl(event);
    });

    $('#state-tutorial-button').click(() => {
      this._handleClickViewTutorial();
    });

    $('.modal__button--close').click((event: JQuery.Event) => {
      this._handleClickCloseModal(event);
    });
  }

  /**
   * Simulate a new turn.
   *
   * @category Game
   * @category Base
   */
  protected _handleClickSimulateTurn(): void {
    if (!this.controlsToImplement.length) {
      if (!confirm('You have not selected any controls.\n\nAre you sure you wish to continue?')) {
        return;
      }
      this._simulateTurn();
    } else {
      this.state = GameState.Placing;
      this._renderGameState(this.state);
    }
  }

  /**
   * Display details of an incident.
   *
   * @category Game
   * @category Base
   *
   * @param event  The calling event.
   */
  protected _handleClickViewEvent(event: JQuery.Event): void {
    this._renderingService.renderEventDetailsModal(this.organisation, event.target.value);
  }

  /**
   * Stage a control for implementation.
   *
   * @category Game
   * @category Base
   *
   * @param event  The calling event.
   */
  protected _handleClickImplementControl(event: JQuery.Event): void {
    if (this.spendAvailable - event.target.value >= 0.0) {
      this.spendAvailable -= parseFloat(event.target.value);
      this.spendAllocated += parseFloat(event.target.value);
      this.controlsToImplement.push(event.target.id.split('-')[1]);
    }

    this._renderingService.renderSpendFigures(this.spendAvailable, this.spendAllocated);

    const modalId = $(event.target).parents('.modal').attr('id') || 'new-controls';

    const viewMode = $(`#${modalId}`).children('.modal__content').hasClass('modal__content--tiles') ? 'tiles' : 'table';

    switch (modalId) {
      case 'new-controls':
        console.debug(viewMode);
        this._handleClickViewAvailableControls(viewMode, false);
        break;
      case 'implemented-controls':
        this._handleClickViewImplementedControls(viewMode);
        break;
      case 'asset-controls':
        this._showAssetControls(
          this._assets.find((asset) => asset.slug === $('#asset-controls .asset-name').attr('id')),
          viewMode,
        );
        break;
      default:
        throw 'Could not get parent table ID';
    }
  }

  /**
   * De-stage a control from implementation.
   *
   * @category Game
   * @category Base
   *
   * @param event  The calling event.
   */
  protected _handleClickRemoveControl(event: JQuery.Event): void {
    this.spendAvailable += parseFloat(event.target.value);
    this.spendAllocated -= parseFloat(event.target.value);

    const controlId = event.target.id.split('-')[1];
    console.debug(controlId);
    this.controlsToImplement = this.controlsToImplement.filter((id) => {
      return id !== controlId;
    });

    const modalId = $(event.target).parents('.modal').attr('id') || 'new-controls';
    const viewMode = $(`#${modalId}`).children('.modal__content').hasClass('modal__content--tiles') ? 'tiles' : 'table';

    switch (modalId) {
      case 'new-controls':
        console.debug(viewMode);
        this._handleClickViewAvailableControls(viewMode, false);
        break;
      case 'implemented-controls':
        this._handleClickViewImplementedControls(viewMode);
        break;
      case 'asset-controls':
        this._showAssetControls(
          this._assets.find((asset) => asset.slug === $('#asset-controls .asset-name').attr('id')),
          viewMode,
        );
        break;
      default:
        throw 'Could not get parent table ID';
    }

    this._renderingService.renderSpendFigures(this.spendAvailable, this.spendAllocated);
  }

  /**
   * Checks control placement against an asset.
   *
   * @category Game
   * @category Base
   *
   * @param event  The calling event.
   */
  protected _handleClickAssetIcon(event: JQuery.Event): void {
    switch (this.state) {
      case GameState.Purchasing:
        const assetSlug: string = $(event.target).parent('.assets__asset, .environment-header__image').attr('id');
        const asset: Asset = this._assets.find((asset) => asset.slug === assetSlug) || AssetLocations[assetSlug];
        this._showAssetControls(asset, DEFAULT_CONTROL_VIEW_MODE);
        break;
      case GameState.Placing:
        console.debug(
          `Placement check: ${this._placingControl.asset} === ${$(event.target)
            .parent('.assets__asset, .environment-header__image')
            .attr('id')}`,
        );
        if (
          this._placingControl.asset === $(event.target).parent('.assets__asset, .environment-header__image').attr('id')
        ) {
          this.controlsToImplement = this.controlsToImplement.filter(
            (controlId) => this._placingControl.id != controlId,
          );
          this._implementControl(this._placingControl.id);
          this._placingControl = null;
          $('#game-state-banner').html('Placing');

          window.alert('Correct!');
          this._placeControls();
        } else window.alert('Incorrect! Please try again.');
        break;
      default:
    }
  }

  /**
   * Select a control to place.
   *
   * @category Game
   * @category Base
   *
   * @param event  The calling event.
   */
  protected _handleClickPlacableControl(event: JQuery.Event): void {
    let controlId = $(event.target).attr('id') || $(event.target).parents('.tile').attr('id');
    controlId = controlId.split('-')[1];

    this._placingControl = this.newControls.find((control) => control.id === controlId);
    if (!this._placingControl) throw 'Error getting control!';
    this._renderingService.toggleModal('control-placement');
    $('#game-state-banner').html(
      `Placing <span id="control-to-place-name">${this._placingControl.number}.&nbsp;${this._placingControl.name}</span>`,
    );
  }

  /**
   * Displays the organisation's historical balance throughout the game.
   *
   * @category Game
   * @category Base
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
        balances.push(this.organisation.balance);
        this._renderingService.renderHistoryModal(balances, this.organisation);
      },
    });
  }

  /**
   * Gets all implemented controls and displays them
   *
   * @category Game
   * @category Base
   * @category AJAX
   *
   * @param mode  The control view mode. Default `DEFAULT_CONTROL_VIEW_MODE`.
   *
   * @todo Make async
   * @todo Use {@link AjaxService}.
   */
  protected _handleClickViewImplementedControls(mode = DEFAULT_CONTROL_VIEW_MODE): void {
    ajaxGET({
      url: `organisations/${this.organisation.id}/get/controls`,
      authHeader: true,
      successFn: (controls: Control[]) => {
        this._renderingService.renderImplementedControlsModal(controls, mode);
      },
    });
  }

  /**
   * Gets all available (i.e., unimplemented) controls and displays them.
   *
   * @category Game
   * @category Base
   * @category AJAX
   *
   * @param mode  The control view mode. Default `DEFAULT_CONTROL_VIEW_MODE`.
   * @param makeRequest  If `false`, uses cached values. Default `true`.
   *
   * @todo Make async
   * @todo Use {@link AjaxService}.
   */
  protected _handleClickViewAvailableControls(mode = DEFAULT_CONTROL_VIEW_MODE, makeRequest = true): void {
    if (makeRequest) {
      ajaxGET({
        url: `organisations/${this.organisation.id}/get/controls/new`,
        authHeader: true,
        successFn: (newControls) => {
          this.newControls = newControls;
          this._handleClickViewAvailableControls(DEFAULT_CONTROL_VIEW_MODE, false);
        },
      });
    } else {
      this._renderingService.renderAvailableControlsModal(
        this.newControls,
        this.controlsToImplement,
        this.spendAvailable,
        mode,
      );
    }
  }

  /**
   * Shows a tutorial modal.
   *
   * @category Game
   * @category Base
   */
  protected _handleClickViewTutorial(): void {
    if (!this._placingControl) {
      this._renderingService.renderTutorialModal(
        this._tutorials.find(
          /* eslint-disable @typescript-eslint/ban-ts-comment */
          // @ts-ignore: TS2367
          (tutorial) => tutorial.state === GameState[this.state],
          /* eslint-enable @typescript-eslint/ban-ts-comment */
        ).text,
        this.state,
      );
    } else {
      this._renderingService.renderTutorialModal(
        this._placingControl.description,
        `Currently placing: ${this._placingControl.number}&nbsp;${this._placingControl.name}`,
      );
    }
  }

  /**
   * Change the view mode setting for the current control modal.
   *
   * @category Game
   * @category Base
   *
   * @param event  The calling event.
   *
   * @todo  Type `event`.
   */
  protected _handleClickChangeViewMode(event: JQuery.Event): void {
    const currMode = $(event.target).hasClass('button--view-table') ? 'tiles' : 'table';
    const newMode = currMode === 'table' ? 'tiles' : 'table';

    $(event.target).removeClass(`button--view-${currMode}`);
    $(event.target).addClass(`button--view-${newMode}`);
    $(event.target).html(`View ${newMode}`);
    const modalId = $(event.target).parents('.modal').attr('id');

    switch (modalId) {
      case 'implemented-controls':
        this._handleClickViewImplementedControls(currMode);
        break;
      case 'asset-controls':
        const assetSlug = $(event.target).siblings('.modal__title').children('.asset-name').attr('id');
        this._showAssetControls(
          this._assets.find((asset) => asset.slug === assetSlug) || AssetLocations[assetSlug],
          currMode,
        );
        break;
      case 'new-controls':
        this._handleClickViewAvailableControls(currMode, false);
        break;
      default:
        throw 'Unknown modal ID!';
    }
  }

  /**
   * Closes a modal and, if it is the end-of-turn results summary, starts a new
   * turn.
   *
   * @category Game
   * @category Base
   *
   * @param event  The calling event.
   *
   * @todo  Type `event`.
   */
  protected _handleClickCloseModal(event: JQuery.Event): void {
    const modalId: string = $(event.target).parents('.modal').attr('id');

    this._renderingService.toggleModal(modalId);

    if ($(event.target).parents('.modal').prop('id') === 'turn-results') {
      this._resetControlSelection();
      for (const func of this._controlEffects) {
        const funcBound = func.bind(this);
        funcBound();
      }
      this._renderGameState(this.state);
    }
  }

  /**
   * Closes the loading splash screen.
   *
   * @category Game
   * @category Base
   */
  handleFinishLoading(): void {
    this._renderingService.toggleLoadingSplash();
  }

  /**
   * Shows the new user intro tutorial modal.
   *
   * @category Game
   * @category Base
   */
  showNewUserTutorial(): void {
    this._renderingService.renderTutorialModal(this._tutorials.find((tutorial) => !tutorial.state).text);
  }

  /****************************************************************************
   * Rendering requests.
   ****************************************************************************/

  /**
   * Sets values to reflect the current game state and displays it.
   *
   * @category Game
   * @category Base
   *
   * @param state  The current game state.
   */
  protected _renderGameState(state: GameState): void {
    console.debug(`Rendering game state: ${GameState[state]}`);
    this._renderingService.renderGameStateBanner(state);
    this._renderingService.renderSimulateButton(state);

    switch (state) {
      case GameState.Purchasing:
        this.spendAvailable = this.moneyPerTurn;
        this.spendAllocated = 0.0;

        this._renderingService.renderTurnNumber(this.currentTurn, this.maxTurns);
        this._renderingService.renderBalance(this.organisation.balance, 'current-balance');
        this._renderingService.renderEventLogTable(this.organisation, 'event-log');
        this._renderingService.renderSpendFigures(this.spendAvailable, this.spendAllocated);
        this._renderingService.renderDisplay(this.showAvailableControls, this.organisation.controls, this.newControls);

        const newThreatActors: ThreatActor[] = this._threatActors.filter((threatActor) => {
          return threatActor.includeFrom <= this.currentTurn / this.maxTurns && !threatActor.includeWarningShown;
        });
        if (newThreatActors.length) {
          this._renderingService.renderNewThreatActorsWarningModal(newThreatActors);
          for (const threatActor of newThreatActors) threatActor.includeWarningShown = true;
        }
        break;
      case GameState.Placing:
        this._placeControls();
        break;
      case GameState.Simulating:
        this._renderingService.renderSpendFigures(this.spendAvailable, this.spendAllocated, false);

        this._getOrganisationDetails(this.organisation.id);

        this._renderingService.renderModalLoading('turn-results', 'turn-events');
        this._renderingService.toggleModal('turn-results');
        break;
      case GameState.Results:
        $('.modal__text .amount-spent').html(formatter.format(this.spendAllocated));
        $('.modal__text .amount-invested').html(formatter.format(this.spendAvailable));
        const events = this.organisation.events.filter((event: JQuery.Event) => event.turn === this.currentTurn - 1);
        let sumCost = 0;
        events.forEach((event: JQuery.Event) => {
          if (!event.mitigated) sumCost += event.cost;
        });
        $('.modal__text .amount-lost').html(formatter.format(sumCost));

        this._renderingService.renderEventLogTable(this.organisation, 'turn-events', this.currentTurn - 1);
        this._renderingService.renderBalance(this.organisation.balance, 'current-balance');
        break;
      case GameState.Ended:
        this._renderingService.renderEventLogTable(this.organisation, 'game-events');
        this._renderingService.renderBalance(this.organisation.balance, 'final-balance');

        $('#simulate-turn').prop('disabled', true);
        $('#view-new-controls').prop('disabled', true);

        this._renderingService.toggleModal('end-of-game');
        break;
      default:
        throw 'Invalid game state';
    }
  }

  /**
   * Shows all implemented controls for a given asset.
   *
   * @category Game
   * @category Base
   *
   * @param asset  The asset being viewed.
   * @param mode  The control view mode. Default `DEFAULT_CONTROL_VIEW_MODE`.
   */
  protected _showAssetControls(asset: Asset, mode = DEFAULT_CONTROL_VIEW_MODE): void {
    this._renderingService.renderImplementedControlsModal(
      this.organisation.controls.filter((control) => control.asset === asset.slug),
      mode,
      asset,
    );
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
   * @category Game
   * @category Base
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

    this._renderGameState(GameState.Simulating);

    ajaxPOST({
      url: 'games/simulate-turn',
      data,
      authHeader: true,
      successFn: (updatedGame) => {
        localStorage.setItem('game', JSON.stringify(updatedGame));

        this.currentTurn = updatedGame.currentTurn;
        this.state = updatedGame.state;
        this.organisation = updatedGame.organisations[0];

        this._renderGameState(GameState.Results);
      },
    });
  }

  /**
   * Sends a PATCH request to implement a new control.
   *
   * Fires after the player has successfully identified the correct asset for
   * the control.
   *
   * @category Game
   * @category Base
   * @category AJAX
   *
   * @param controlId  The ObjectID of the control to implement.
   *
   * @todo Make async
   * @todo Use {@link AjaxService}.
   */
  protected _implementControl(controlId: string): void {
    const data = {
      organisationId: this.organisation.id,
      newControlId: controlId,
    };

    ajaxPATCH({
      url: 'organisations/add/control',
      data,
      authHeader: true,
      successFn: (organisation) => {
        this.organisation = organisation;

        const controlsWithEffects: Control[] = this.organisation.controls.filter(
          (control) => control.effect !== undefined,
        );

        if (controlsWithEffects) {
          /*eslint-disable @typescript-eslint/ban-types */
          const newControlEffects: Function[] = controlsWithEffects.map(
            (control) => new Function(control.effect.script),
          );
          /*eslint-enable @typescript-eslint/ban-types */

          for (const newFunc of newControlEffects) this._controlEffects.push(newFunc);
        }

        this._renderingService.renderBalance(this.organisation.balance, 'current-balance');
      },
    });
  }

  /**
   * Promps the player to place all of their chosen controls before continuing.
   *
   * @category Game
   * @category Base
   */
  protected _placeControls(): void {
    if (this.controlsToImplement.length) {
      this._renderingService.renderControlPlacementModal(
        this.newControls.filter((control) => this.controlsToImplement.includes(control.id)),
      );
    } else {
      this._simulateTurn();
    }
  }

  /**
   * Resets all control placement values after the decisions have been confirmed.
   *
   * @category Game
   * @category Base
   */
  protected _resetControlSelection(): void {
    this._placingControl = null;
    this.controlsToImplement = [];
    this.spendAvailable = this.moneyPerTurn;
    this.spendAllocated = 0.0;
  }

  /****************************************************************************
   * Configuration.
   ****************************************************************************/

  /**
   * Gets all admin-configurable game settings.
   *
   * @category Game
   * @category Base
   *
   * @param settings  The set of server-defined game settings.
   *
   * @todo Make async
   * @todo Use {@link AjaxService}.
   */
  protected _setGameSettings(settings: GameSettings): void {
    this._assets = settings.assets;
    this._threatActors = settings.threatActors;
    this._securityAreas = settings.securityAreas;
    this._tutorials = settings.tutorials;
  }

  /**
   * Gets details of the player's assigned organisation.
   *
   * @category Game
   * @category Base
   * @category AJAX
   *
   * @param id  The ObjectID of the organisation.
   *
   * @todo Make async
   * @todo Use {@link AjaxService}.
   * @todo Add method to get details about competitors in multi-player.
   */
  protected _getOrganisationDetails(id: string): void {
    ajaxGET({
      url: `organisations/${id}`,
      authHeader: true,
      async: false,
      successFn: (organisation: Organisation) => {
        localStorage.setItem('organisation', JSON.stringify(organisation));

        ajaxGET({
          url: `organisations/${organisation.id}/get/controls/new`,
          authHeader: true,
          successFn: (newControls) => {
            this.newControls = newControls;
          },
        });
      },
    });
  }

  /**
   * Gets details of the current game.
   *
   * @category Game
   * @category Base
   * @category AJAX
   *
   * @param id  The ObjectID of the current game.
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

  /**
   * Updates the current game state.
   *
   * @category Game
   * @category Base
   * @category AJAX
   *
   * @param game  The game state object.
   *
   * @todo Make async
   * @todo Use {@link AjaxService}.
   * @todo Refactor organisation detail retrieval with eye to encapsulation.
   */
  protected _updateLocalGameState(game: Game): void {
    this._controlEffects = [];
    this._id = game.id;
    this.maxTurns = game.maxTurns;
    this.currentTurn = game.currentTurn;
    this.moneyPerTurn = game.moneyPerTurn;
    this.showAvailableControls = game.showAvailableControls;
    this.state = game.state;
    this._gameType = game.gameType;
    // TODO bad.
    /*eslint-disable @typescript-eslint/ban-ts-comment */
    this._getOrganisationDetails(
      // @ts-ignore: TS2345
      game.organisations[0].members
        ? game.organisations.find((organisation) => {
            return organisation.members.includes(this._userId);
          }).id
        : game.organisations[0],
    );
    /*eslint-enable @typescript-eslint/ban-ts-comment */
    this.organisation = JSON.parse(localStorage.getItem('organisation'));

    const controlsWithEffects: Control[] = this.organisation.controls.filter((control) => control.effect !== undefined);
    if (controlsWithEffects) {
      /*eslint-disable @typescript-eslint/ban-types */
      const controlEffects: Function[] = controlsWithEffects.map((control) => new Function(control.effect.script));
      /*eslint-enable @typescript-eslint/ban-types */

      for (const func of controlEffects) this._controlEffects.push(func);
    }

    ajaxGET({
      url: `organisations/${this.organisation.id}/get/controls/new`,
      authHeader: true,
      async: false,
      successFn: (newControls) => {
        this.newControls = newControls;
      },
    });
  }
}

/**
 * Represents the base multiplayer game service.
 *
 * @category Game
 * @category Multiplayer
 * @category Base
 * @category Services
 */
export abstract class BaseMultiplayerGameService extends BaseGameService {
  /**
   * Functions to run at regular intervals (for multiplayer games).
   */
  protected _polls: Polls = {};

  /**
   * Registers multiplayer-only event handlers and sets up the polling.
   *
   * @category Game
   * @category Multiplayer
   * @category Base
   *
   * @param userId  The ID of the logged-in user.
   * @param game  The current game.
   * @param settings  The server-defined game settings.
   * @param gameType  The current game type (passed by each sub-class).
   */
  constructor(userId: string, game: Game, settings: GameSettings, gameType: GameType) {
    super(userId, game, settings, gameType);

    setInterval(() => {
      this._poll();
    }, process.env.POLL_INTERVAL);
  }

  /****************************************************************************
   * Event handlers.
   ****************************************************************************/

  /**
   * Registers any multiplayer-only event handlers.
   *
   * @category Game
   * @category Multiplayer
   * @category Base
   * @category jQuery
   */
  protected _registerEventHandlers(): void {
    super._registerEventHandlers();

    $('button#view-players').click(() => {
      this._handleClickShowPlayers();
    });
  }

  /**
   * Displays the organisation's historical balance throughout the game.
   *
   * @category Game
   * @category Base
   * @category Multiplayer
   * @category AJAX
   *
   * @todo Make async
   * @todo Use {@link AjaxService}.
   */
  protected _handleClickShowPlayers(): void {
    ajaxGET({
      url: `games/${this._id}/get/players`,
      authHeader: true,
      successFn: (players: User[]) => {
        let names = '';
        for (const player of players) {
          names += `- ${player.username}\n`;
        }
        alert(`Players:\n\n${names}`);
      },
    });
  }

  /**
   * Updates the view mode argument for the polling function.
   *
   * @category Game
   * @category Multiplayer
   * @category Base
   *
   * @param event  The calling event.
   */
  protected _handleClickChangeViewMode(event: JQuery.Event): void {
    const currMode = $(event.target).hasClass('button--view-table') ? 'tiles' : 'table';
    const newMode = currMode === 'table' ? 'tiles' : 'table';

    super._handleClickChangeViewMode(event);

    const modalId = $(event.target).parents('.modal').attr('id');

    this._updatePoll(modalId, null, [newMode, false]);
  }

  /**
   * Registers the function from polling.
   *
   * @category Game
   * @category Multiplayer
   * @category Base
   *
   * @param event  The calling event.
   */
  protected _handleClickCloseModal(event: JQuery.Event): void {
    const modalId: string = $(event.target).parents('.modal').attr('id');

    this._removePoll(modalId);

    super._handleClickCloseModal(event);
  }

  /****************************************************************************
   * Netcode.
   ****************************************************************************/

  /**
   * Runs all registered polling functions.
   *
   * @category Game
   * @category Multiplayer
   * @category Base
   */
  protected _poll(): void {
    this._getGameDetails(this._id);
    this._updateLocalGameState(JSON.parse(localStorage.getItem('game')));

    for (const key of Object.keys(this._polls)) {
      const poll = this._polls[key];

      const callbackBound = poll.callback.bind(this);
      callbackBound(...poll.args);
    }
  }

  /*eslint-disable @typescript-eslint/ban-types */
  /**
   * Registers a function to be polled.
   *
   * @category Game
   * @category Multiplayer
   * @category Base
   *
   * @param key  The key to identify the callback (e.g., a modal element ID).
   * @param callback  The function to call on poll.
   * @param args  Any args to call the function with. Default `[]`.
   */
  protected _addPoll(key: string, callback: Function, args: any[] = []): void {
    if (!this._polls[key]) this._polls[key] = { callback, args };
  }

  /**
   * Updates a polled function.
   *
   * @category Game
   * @category Multiplayer
   * @category Base
   *
   * @param key  The key to identify the callback (e.g., a modal element ID).
   * @param callback  The function to call on poll.
   * @param args  Any args to call the function with. Default `[]`.
   */
  protected _updatePoll(key: string, callback?: Function, args?: any[]): void {
    if (this._polls[key]) {
      this._polls[key] = {
        callback: callback || this._polls[key].callback,
        args: args || this._polls[key].args,
      };
    } else throw 'Poll not found.';
  }
  /*eslint-enable @typescript-eslint/ban-types */

  /**
   * Deregisters a function from polling.
   *
   * @category Game
   * @category Multiplayer
   * @category Base
   *
   * @param key  The key to identify the callback (e.g., a modal element ID).
   */
  protected _removePoll(key: string): void {
    if (this._polls[key]) delete this._polls[key];
  }
}
