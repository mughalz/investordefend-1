/**
 * This module defines the base game rendering services, which process all
 * requests relating to drawing the game display.
 *
 * These services only handle game rendering. For game logic, see {@link BaseGameServices}.
 * For game management (e.g., initialising and exiting games, see {@link GameService}.
 * For game administration (e.g., creating new games), see {@link GameAdminService}.
 *
 * @category Game
 * @category Base
 * @category Services
 *
 * @module BaseRenderingServices
 */

import $ from 'jquery';
import Chart from 'chart.js/auto';

import { GameState, GameType, AssetLocation, formatter, enumKeys } from '../_helpers';
import { Organisation, Control, Event, Asset, SecurityArea, ThreatActor } from '../types/typings.d';
import AjaxLoader from '../../img/ajax-spinner.gif';

/**
 * Represents the base game rendering service.
 *
 * @category Game
 * @category Base
 * @category Services
 */
export abstract class BaseRenderingService {
  /**
   * The spinner to display when an AJAX call is in progress.
   *
   * @todo Doesn't seem to work in built app.
   * @todo Add type.
   */
  protected _spinner;

  /****************************************************************************
   * Game settings.
   ****************************************************************************/

  /**
   * The assets to which controls and events can be assigned.
   */
  protected _assets: Asset[];

  /**
   * The threat actors which which events can be attributed.
   */
  protected _threatActors: ThreatActor[];

  /**
   * The security areas by which controls and events can be classified.
   */
  protected _securityAreas: SecurityArea[];

  /****************************************************************************
   * Visuals.
   ****************************************************************************/

  /**
   * The x,y dimensions for each game environment.
   */
  protected _environmentDimensions: { office: { x: number; y: number }; internet: { x: number; y: number } };

  /**
   * The organisation balance line chart.
   */
  protected _historyChart: Chart = null;

  /****************************************************************************
   * Game details.
   ****************************************************************************/

  /**
   * The game type of the game.
   */
  protected _gameType: GameType;

  /**
   * Gets server-defined game settings.
   *
   * @category Game
   * @category Base
   *
   * @param assets  The server-defined list of assets.
   * @param threatActors  The server-defined list of threat actors.
   * @param securityAreas  The server-defined list of security areas.
   * @param gameType  The game type.
   */
  constructor(assets: Asset[], threatActors: ThreatActor[], securityAreas: SecurityArea[], gameType: GameType) {
    this._spinner = new Image();
    this._spinner.src = AjaxLoader;

    this._assets = assets;
    this._threatActors = threatActors;
    this._securityAreas = securityAreas;
    this._gameType = gameType;
  }

  /****************************************************************************
   * Game rendering.
   ****************************************************************************/

  /**
   * Toggles the initial game loading splash screen.
   *
   * @category Game
   * @category Base
   */
  toggleLoadingSplash(): void {
    $('#loading-splash').toggle(400);
  }

  /**
   * Updates the main game display.
   *
   * @category Game
   * @category Base
   *
   * @param showAvailableControls  Whether to show the number of available controls for each asset.
   * @param controls  The controls that the player has implemented.
   * @param newControls  The controls that are available to the player.
   */
  renderDisplay(showAvailableControls: boolean, controls: Control[], newControls?: Control[]): void {
    const office = $('#office-assets');
    const internet = $('#internet-assets');

    office.html('');
    internet.html('');
    $('.environment__header .asset__figures').remove();

    // Get the size of the grid from the max co-ords provided.
    if (!this._environmentDimensions) {
      this._environmentDimensions = this._getEnvironmentDimensions();
      for (const environment of ['office', 'internet']) {
        $(`.environment__assets#${environment}-assets`)
          .css('grid-template-columns', `repeat(${this._environmentDimensions[environment].x}, 1fr [col-start])`)
          .css('grid-template-rows', `repeat(${this._environmentDimensions[environment].y}, 1fr [row-start])`);
      }
    }

    let assetFigures = '<div class="asset__figures"><span class="figures__implemented">0</span>';
    if (showAvailableControls) assetFigures += '/<span class="figures__available">0</span>';
    assetFigures += '</div>';

    for (const asset of this._assets) {
      if (asset.location) {
        const assetLocation = asset.location.split('-');
        const assetIcon = $(`
          <div class="assets__asset" id="${asset.slug}" style="grid-column-start: col-start ${assetLocation[1]}; grid-row-start: row-start ${assetLocation[2]}">
            <img class="asset__icon" src="images/${asset.img}">
          </div>
        `);

        if (assetLocation[0] === 'org') office.append(assetIcon);
        else if (assetLocation[0] === 'inet') internet.append(assetIcon);
        else throw 'Unknown environment value!';

        $(`#${asset.slug} .asset__icon`).after(assetFigures);
      }
    }

    for (const assetLocation of enumKeys(AssetLocation)) {
      $(`#${AssetLocation[assetLocation]} .asset__icon`).after(assetFigures);
    }

    controls.forEach((control) => {
      const assetImplemented = $(`#${control.asset} .figures__implemented`);
      assetImplemented.html(Number(assetImplemented.html()) + 1);
    });

    if (newControls) {
      newControls.forEach((control) => {
        const assetAvailable = $(`#${control.asset} .figures__available`);
        assetAvailable.html(Number(assetAvailable.html()) + 1);
        if (showAvailableControls && Number(assetAvailable.html()) > 0) {
          $(`#${control.asset} .asset__figures`).addClass('asset__figures--has-available');
        }
      });
    } else console.warn('No newControls');
  }

  /**
   * Updates the game state banner.
   *
   * @category Game
   * @category Base
   *
   * @param state  The current game state.
   */
  renderGameStateBanner(state: GameState): void {
    $('.text__value#game-state-banner').html(GameState[state]);
  }

  /**
   * Updates the player organisation's name.
   *
   * @category Game
   * @category Base
   *
   * @param name  The name of the player's organisation.
   *
   * @todo Add new method for rendering competitor org names in multi-player.
   */
  renderOrganisationName(name: string): void {
    $('.sidebar__title#organisation-name').html(name);
    $('#office-environment-header').html(name);
  }

  /**
   * Updates the player organisation's current balance/score.
   *
   * @category Game
   * @category Base
   *
   * @param balance  The current balance of the player's organisation.
   * @param elemID  The element ID of the label to update.
   *
   * @todo Is there any reason to specify the element ID?
   * @toto Handle competitor balances in multi-player.
   */
  renderBalance(balance: number, elemId: string): void {
    const label = $(`.text--value#${elemId}`);

    const currBalance = Number(label.text().replace(/[^0-9.-]+/g, '')) || 0.0;

    label.prop('Counter', currBalance).animate(
      {
        Counter: balance,
      },
      {
        duration: 1000,
        easing: 'swing',
        step: function (now) {
          label.html(formatter.format(now));
          if (balance < 0.0) {
            label.addClass('negative');
          } else {
            label.removeClass('negative');
          }
        },
      },
    );
  }

  /**
   * Updates the current turn of the vale.
   *
   * @category Game
   * @category Base
   *
   * @param currentTurn  The current game turn.
   * @param maxTurns  The maximum number of turns in the game.
   */
  renderTurnNumber(currentTurn: number, maxTurns: number): void {
    const label = $('.text--value#current-turn');
    label.html(`${currentTurn}/${maxTurns}`);
  }

  /**
   * Updates spend figures during the control purchasing phase.
   *
   * @category Game
   * @category Base
   *
   * @param spendAvailable  The amount of money available to the player.
   * @param spendAllocated  The amount of money the player has spent on controls.
   * @param show  Whether spend figures should be displayed or not. Default `true`.
   */
  renderSpendFigures(spendAvailable: number, spendAllocated: number, show = true): void {
    if (show) {
      const availableToSpendLabel = $(`.text--value#spend-available`);
      const allocatedSpendLabel = $(`.text--value#spend-allocated`);

      const currAvail = Number(availableToSpendLabel.text().replace(/[^0-9.-]+/g, '')) || 0.0;
      const currAlloc = Number(allocatedSpendLabel.text().replace(/[^0-9.-]+/g, '')) || 0.0;

      availableToSpendLabel.prop('Counter', currAvail).animate(
        {
          Counter: spendAvailable,
        },
        {
          duration: 500,
          easing: 'swing',
          step: function (now) {
            availableToSpendLabel.html(formatter.format(now));
          },
        },
      );

      allocatedSpendLabel.prop('Counter', currAlloc).animate(
        {
          Counter: spendAllocated,
        },
        {
          duration: 500,
          easing: 'swing',
          step: function (now) {
            allocatedSpendLabel.html(formatter.format(now));
          },
        },
      );

      $('.sidebar__text#money-to-spend').show();
      $('.sidebar__text#money-spent').show();
    } else {
      $('.sidebar__text#money-to-spend').hide();
      $('.sidebar__text#money-spent').hide();
    }
  }

  /**
   * Displays the ‘Simulate Turn’ button.
   *
   * @category Game
   * @category Base
   *
   * @param state  The current state of the game.
   */
  renderSimulateButton(state: GameState): void {
    const button = $('.button#simulate-turn');

    $(button).prop('disabled', false);

    switch (state) {
      case GameState.Purchasing:
      case GameState.Placing:
        $(button).html(`Simulate Turn`);
        break;
      case GameState.Simulating:
        $(button).html(`Simulating Turn...`);
      case GameState.Results:
        $(button).prop('disabled', true);
        break;
      default:
        throw 'Unknown game state!';
    }
  }

  /****************************************************************************
   * Modal rendering.
   ****************************************************************************/

  /**
   * Toggles a modal's visibility.
   *
   * @category Game
   * @category Base
   *
   * @param modalId  The element ID of the modal to toggle.
   */
  toggleModal(modalId: string): void {
    const modal = $(`.modal#${modalId}`);

    if (modal.hasClass('modal--visible')) modal.removeClass('modal--visible');
    else modal.addClass('modal--visible');
  }

  /**
   * Renders the loading state for a given modal table.
   *
   * @category Game
   * @category Base
   *
   * @param modalId  The element ID of the table's parent modal.
   * @param modalTableId  The element ID of the table to render.
   */
  renderModalLoading(modalId: string, modalTableId: string): void {
    $(`${modalId} .table#${modalTableId}`).html(this._spinner);
  }

  /**
   * Displays any new threat actors that are coming into play.
   *
   * @category Game
   * @category Base
   *
   * @param newThreatActors  Any new threat actor(s).
   */
  renderNewThreatActorsWarningModal(newThreatActors: ThreatActor[]): void {
    let newThreatActorsList = '';
    for (const threatActor of newThreatActors) newThreatActorsList += `- ${threatActor.name}\n`;
    window.alert(`New threat actors detected:\n${newThreatActorsList}`);
  }

  /**
   * Displays a tutorial modal.
   *
   * @category Game
   * @category Base
   *
   * @param tutorialText  The tutorial text to display.
   * @param tutorialTitle  Optional. The title of the modal to display.
   */
  renderTutorialModal(tutorialText: string, tutorialTitle?: string | GameState): void {
    let tutorialHTML = `<h2 class="modal__subtitle">${
      tutorialTitle !== undefined ? GameState[tutorialTitle] || tutorialTitle : '<cite>Invest or Defend</cite>'
    }</h2>`;
    tutorialHTML += `<p class="text modal__text">${tutorialText}</p>`;

    $('.modal#how-to-play .modal__content').html(tutorialHTML);

    if (!$('.modal#how-to-play').hasClass('modal--visible')) this.toggleModal('how-to-play');
  }

  /**
   * Displays a single event's details in a modal.
   *
   * @category Game
   * @category Base
   *
   * @param organisation  The organisation to show the event for.
   * @param eventId  The ObjectId of the event to review.
   */
  renderEventDetailsModal(organisation: Organisation, eventId: string): void {
    const event: Event = organisation.events.find((event) => event.id === eventId);
    const mitigatedBy: Control = organisation.controls.find((control) => control.id === event.mitigatedBy);

    $('#event-name').html(this._generateEventName(event));

    $('.text--value#event-threat-actor').html(event.threatActor);
    $('.text--value#event-asset').html(event.asset);

    $('.text--value#event-turn').html(event.turn);
    $('.text--value#event-cost').html(`<span class="negative">${formatter.format(event.cost)}</span>`);
    $('.text--value#event-mitigated').html(
      event.mitigated ? '<span class="positive">Yes</span>' : '<span class="negative">No</span>',
    );

    if (event.mitigated) {
      $('.text--value#event-mitigated-by').html(
        `<span class="positive">${mitigatedBy.number}. ${mitigatedBy.name}</span>`,
      );
      $('.text--value#event-mitigated-cost').html(
        `<span class="positive">${formatter.format(event.mitigatedCost)}</span>`,
      );
      $('.modal__text#event-mitigated-by-label').show();
      $('.modal__text#event-mitigated-cost-label').show();
    } else {
      $('.modal__text#event-mitigated-by-label').hide();
      $('.modal__text#event-mitigated-cost-label').hide();
    }

    $('#event-description').html(this._generateEventDescription(event));

    this.toggleModal('event-details');
  }

  /**
   * Displays the historical organisation balances in a modal.
   *
   * @category Game
   * @category Base
   *
   * @param balances  The balance values of the organisation over time.
   */
  renderHistoryModal(balances: number[], organisation: Organisation): void {
    const canvas = <HTMLCanvasElement>document.getElementById('org-history-chart');
    const ctx = canvas.getContext('2d');
    if (this._historyChart) this._historyChart.destroy();

    this._historyChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: Array(balances.length)
          .fill(1)
          .map((elem, i) => i + 1),
        datasets: [
          {
            label: `${organisation.name} Balance`,
            data: balances,
            borderColor: 'red',
            backgroundColor: 'red',
          },
        ],
      },
      options: {
        fill: false,
        scales: {
          y: {
            ticks: {
              callback: (value) => {
                return formatter.format(value);
              },
            },
          },
        },
      },
    });

    if (!$('.modal#org-history').hasClass('modal--visible')) this.toggleModal('org-history');
  }

  /**
   * Displays implemented controls in a modal.
   *
   * @category Game
   * @category Base
   *
   * @param controls  The controls to display.
   * @param mode  The display mode to use.
   * @param asset  Optional. Use to limit controls to a specific asset.
   */
  renderImplementedControlsModal(controls: Control[], mode: string, asset?: Asset): void {
    if (asset) {
      $('#asset-controls .asset-name').html(asset.name);
      $('#asset-controls .asset-description').html(
        asset.description ||
          `An asset ${
            asset.location.split('-')[0] === 'org'
              ? 'located within your organistion'
              : 'hosted outside of your organisation'
          }.`,
      );
      $('#asset-controls .asset-name').attr('id', asset.slug);
    }

    if (!$(`#${asset ? 'asset' : 'implemented'}-controls .button--change-view-mode`).length) {
      $(`#${asset ? 'asset' : 'implemented'}-controls .modal__header`).append(
        $(
          `<button class="button button--change-view-mode button--view-${mode === 'tiles' ? 'table' : 'tiles'}">View ${
            mode === 'tiles' ? 'table' : 'tiles'
          }</button>`,
        ),
      );
    }

    $(`.modal#${asset ? 'asset' : 'implemented'}-controls .modal__content`)
      .removeClass(`modal__content--${mode === 'tiles' ? 'table' : 'tiles'}`)
      .addClass(`modal__content--${mode}`);

    switch (mode) {
      case 'tiles':
        this._renderImplementedControlsTiles(controls, asset);
        break;
      case 'table':
        this._renderImplementedControlsTable(controls, asset);
        break;
      default:
        throw 'Unknown view mode!';
    }

    if (!$(`.modal#${asset ? 'asset' : 'implemented'}-controls`).hasClass('modal--visible'))
      this.toggleModal(`${asset ? 'asset' : 'implemented'}-controls`);
  }

  /**
   * Displays available controls in a modal.
   *
   * @category Game
   * @category Base
   *
   * @param newControls  The controls to display.
   * @param controlsToImplement  Controls staged to be implemented.
   * @param spendAvailable  The amount of money left for the player to spend.
   * @param mode  The display mode to use.
   */
  renderAvailableControlsModal(
    newControls: Control[],
    controlsToImplement: string[],
    spendAvailable: number,
    mode: string,
  ): void {
    if (!$(`#new-controls .button--change-view-mode`).length) {
      $(`#new-controls .modal__header`).append(
        $(
          `<button class="button button--change-view-mode button--view-${mode === 'tiles' ? 'table' : 'tiles'}">View ${
            mode === 'tiles' ? 'table' : 'tiles'
          }</button>`,
        ),
      );
    }

    $(`.modal#new-controls .modal__content`)
      .removeClass(`modal__content--${mode === 'tiles' ? 'table' : 'tiles'}`)
      .addClass(`modal__content--${mode}`);

    switch (mode) {
      case 'tiles':
        this._renderAvailableControlsTiles(newControls, controlsToImplement, spendAvailable);
        break;
      case 'table':
        this._renderAvailableControlsTable(newControls, controlsToImplement, spendAvailable);
        break;
      default:
        throw 'Unknown view mode!';
    }

    if (!$(`.modal#new-controls`).hasClass('modal--visible')) this.toggleModal('new-controls');
  }

  /**
   * Displays the controls to place for this turn.
   *
   * @category Game
   * @category Base
   *
   * @param controls  The list of controls to place.
   */
  renderControlPlacementModal(controls: Control[]): void {
    $('.controls-to-place').html(controls.length);

    this._renderPlaceableControlsTiles(controls);

    if (!$('.modal#control-placement').hasClass('modal--visible')) this.toggleModal('control-placement');
  }

  /****************************************************************************
   * Content rendering.
   ****************************************************************************/

  /**
   * Displays all event details in a table.
   *
   * @category Game
   * @category Base
   *
   * @param organisation  The organisation to show events for.
   * @param tableId  The element ID of the table to render.
   * @param limitToTurn  Optional. Whether to only show events from the current turn or not.
   */
  renderEventLogTable(organisation: Organisation, tableId: string, limitToTurn?: number): void {
    let tableHTML: string;

    const events = limitToTurn
      ? organisation.events.filter((event) => event.turn === limitToTurn)
      : organisation.events;

    if (events.length) {
      const data: string[][] = [];
      let headers: string[];

      // TODO: append new ones rather than re-writing, to allow for highlighting
      if (tableId === 'event-log') {
        headers = ['Turn', 'Cost', 'Breakdown'];

        // TODO: replace with `map()`?
        tableHTML += '<tbody class="table__body">';
        events.forEach((event) => {
          const mitigated: string[] = event.mitigated ? ['<s>', '</s>'] : ['', ''];

          data.push([
            String(event.turn),
            `${mitigated[0]}<span class="negative">${formatter.format(event.cost)}</span>${mitigated[1]}`,
            `<button class="button button--view-event" id="details-event-${event.id}" value="${event.id}">View</button>`,
          ]);
        });

        tableHTML = this._renderTable(headers, data);
      } else {
        headers = ['Incident', 'Cost', 'Mitigated By', 'Breakdown'];

        // TODO: replace with `map()`?
        events.forEach((event) => {
          const mitigated: string[] = event.mitigated ? ['<s>', '</s>'] : ['', ''];
          const mitigatedBy: Control = organisation.controls.find((control) => control.id === event.mitigatedBy);

          data.push([
            this._generateEventDescription(event),
            `${mitigated[0]}<span class="negative">${formatter.format(event.cost)}</span>${mitigated[1]}`,
            mitigatedBy ? `<span class="positive">${mitigatedBy.number} ${mitigatedBy.name}</span>` : '',
            `<button class="button button--view-event" id="details-event-${event.id}" value="${event.id}">View</button>`,
          ]);
        });

        tableHTML = this._renderTable(headers, data);
      }
      $(`.table#${tableId}`).addClass(`table--${headers.length}-columns`);
    } else {
      tableHTML = '<p>No events!</p>';
    }

    $(`.table#${tableId}`).html(tableHTML);
  }

  /**
   * Displays placeable controls in tile mode.
   *
   * @category Game
   * @category Base
   *
   * @param controls  The controls to display.
   *
   * @todo Use single-tile method below.
   */
  protected _renderPlaceableControlsTiles(controls: Control[]): void {
    let tilesHTML = '';

    if (controls && controls.length > 0) {
      for (const control of controls) {
        const tileHeader = `<h2 class="tile-header__title${
          control.name.length > 15 ? ' tile-header__title--small' : ''
        }"><span class="tile-header-title__before">${control.number}</span>&nbsp;${control.name}</h2>`;

        let tileMain = control.img ? `<img class="tile-main__image" src="images/${control.img}">` : '';
        tileMain += `<p class="tile-main__text">${control.summary || control.description}</p>`;

        let tileFooter = `<p class="tile-footer__text">Cost: ${formatter.format(control.cost)}</p>`;
        tileFooter += '<aside class="tile-footer__group"><p class="tile-footer__text">Security Areas</p>';
        tileFooter += '<ol class="tile-footer__list">';
        for (const securityArea of control.securityAreas) {
          tileFooter += `<li class="tile-footer__text tile-footer__list-item" title="${
            securityArea.summary || securityArea.description
          }">${securityArea.number}.&nbsp;${securityArea.name}</li>`;
        }
        tileFooter += '</ol></aside>';

        tilesHTML += this._renderTile(control.id, tileHeader, tileMain, tileFooter, { selectable: true });
      }
    } else {
      tilesHTML = '<p>No controls implemented.</p>';
    }

    $(`.modal#control-placement .modal__content`).html(tilesHTML);
  }

  /**
   * Displays implemented controls in tile mode.
   *
   * @category Game
   * @category Base
   *
   * @param controls  The controls to display.
   * @param asset  Optional. Use to restrict controls to a specific asset.
   */
  protected _renderImplementedControlsTiles(controls: Control[], asset?: Asset): void {
    let tilesHTML = '';

    if (controls && controls.length > 0) {
      controls.forEach((control: Control) => {
        const mitigationsString =
          control.mitigation > 0
            ? `<span class="positive">${formatter.format(control.mitigation)}</span>`
            : `${formatter.format(control.mitigation)}`;
        const roi = Math.ceil((control['mitigation'] / control.cost) * 100);
        const roiString = roi > 0 ? `<span class="positive">${roi}</span>` : `${roi}`;

        const tileHeader = `<h2 class="tile-header__title${
          control.name.length > 15 ? ' tile-header__title--small' : ''
        }"><span class="tile-header-title__before">${control.number}</span>&nbsp;${control.name}</h2>`;

        let tileMain = control.img ? `<img class="tile-main__image" src="images/${control.img}">` : '';
        tileMain += `<p class="tile-main__text">${control.summary || control.description}</p>`;

        let tileFooter = `<p class="tile-footer__text">Cost: ${formatter.format(control.cost)}</p>`;
        tileFooter += `<p class="tile-footer__text">Asset: ${control.asset}</p>`;
        tileFooter += `<p class="tile-footer__text">Mitigations: ${mitigationsString}</p>`;
        tileFooter += `<p class="tile-footer__text"><abbr title="Return on Investment">RoI</abbr>: ${roiString}&nbsp;%</p>`;

        tilesHTML += this._renderTile(control.id, tileHeader, tileMain, tileFooter);
      });
    } else {
      tilesHTML = '<p>No controls implemented.</p>';
    }

    $(`.modal#${asset ? 'asset' : 'implemented'}-controls .modal__content`).html(tilesHTML);
  }

  /**
   * Displays implemented controls in table mode.
   *
   * @category Game
   * @category Base
   *
   * @param controls  The controls to display.
   * @param asset  Optional. Use to restrict controls to a specific asset.
   */
  protected _renderImplementedControlsTable(controls: Control[], asset?: Asset): void {
    const headers = [
      //'Asset',
      'Image',
      'Name',
      'Description',
      'Cost',
      'Mitigations',
      '<abbr title="Return on Investment">RoI</abbr> (%)',
    ];
    const data: string[][] = [];
    let tableHTML: string;

    if (controls && controls.length > 0) {
      controls.forEach((control: Control) => {
        const mitigationsString =
          control.mitigation > 0
            ? `<span class="positive">${formatter.format(control.mitigation)}</span>`
            : `${formatter.format(control.mitigation)}`;
        const roi = Math.ceil((control['mitigation'] / control.cost) * 100);
        const roiString = roi > 0 ? `<span class="positive">${roi}</span>` : `${roi}`;

        data.push([
          //`<img class="table__icon" src="images/${asset.img}>`,
          control.img ? `<img class="table__icon" src="images/${control.img}">` : '',
          `${control.number}&nbsp;${control.name}`,
          control.summary || control.description,
          formatter.format(control.cost),
          mitigationsString,
          roiString,
        ]);
      });

      tableHTML = this._renderTable(headers, data);
    } else {
      tableHTML = '<p>No controls implemented.</p>';
    }

    $(`.modal#${asset ? 'asset' : 'implemented'}-controls .modal__content`).html(tableHTML);
  }

  /**
   * Displays availble controls in tile mode.
   *
   * @category Game
   * @category Base
   *
   * @param newControls  The controls to display.
   * @param controlsToImplement  Controls staged to be implemented.
   * @param spendAvailable  The amount of money left for the player to spend.
   */
  protected _renderAvailableControlsTiles(
    newControls: Control[],
    controlsToImplement: string[],
    spendAvailable: number,
  ): void {
    let tilesHTML = '';

    if (newControls && newControls.length > 0) {
      newControls.forEach((control: Control) => {
        const flags = { selected: controlsToImplement.includes(control.id) };

        const tileHeader = `<h2 class="tile-header__title${
          control.name.length > 15 ? ' tile-header__title--small' : ''
        }"><span class="tile-header-title__before">${control.number}</span>&nbsp;${control.name}</h2>`;

        let tileMain = control.img ? `<img class="tile-main__image" src="images/${control.img}">` : '';
        tileMain += `<p class="tile-main__text">${control.summary || control.description}</p>`;

        let tileFooter = `<p class="tile-footer__text">Cost: ${formatter.format(control.cost)}</p>`;
        tileFooter += `<p class="tile-footer__text">Effectiveness: ${control.effectiveness}&nbsp;%</p> `;
        tileFooter += '<aside class="tile-footer__group"><p class="tile-footer__text">Security Areas</p>';
        tileFooter += '<ol class="tile-footer__list">';
        for (const securityArea of control.securityAreas) {
          tileFooter += `<li class="tile-footer__text tile-footer__list-item" title="${
            securityArea.summary || securityArea.description
          }">${securityArea.number}.&nbsp;${securityArea.name}</li>`;
        }
        tileFooter += '</ol></aside>';
        tileFooter += controlsToImplement.includes(control.id)
          ? `<button class="button tile-footer__button button--remove-control" id="control-${control.id}" value="${control.cost}">Remove</button>`
          : control.cost <= spendAvailable
          ? `<button class="button tile-footer__button button--implement-control" id="control-${control.id}" value="${control.cost}">Implement</button>`
          : `<button class="button tile-footer__button" disabled id="control-${control.id}" value="">Insufficient Funds</button>`;

        tilesHTML += this._renderTile(control.id, tileHeader, tileMain, tileFooter, flags);
      });
    } else {
      tilesHTML = '<p>No controls available to implement.</p>';
    }

    $(`.modal#new-controls .modal__content`).html(tilesHTML);
  }

  /**
   * Displays availble controls in table mode.
   *
   * @category Game
   * @category Base
   *
   * @param newControls  The controls to display.
   * @param controlsToImplement  Controls staged to be implemented.
   * @param spendAvailable  The amount of money left for the player to spend.
   */
  protected _renderAvailableControlsTable(
    newControls: Control[],
    controlsToImplement: string[],
    spendAvailable: number,
  ): void {
    const headers = ['Name', 'Description', 'Cost', 'Effectiveness', 'Security Area(s)', 'Implement'];
    const data: string[][] = [];
    let tableHTML: string;

    if (newControls && newControls.length > 0) {
      newControls.forEach((control: Control) => {
        let securityAreas = '';
        for (const securityArea of control.securityAreas) {
          securityAreas += `${securityArea.number}.&nbsp;${securityArea.name}<br>`;
        }

        const controlButton: string = controlsToImplement.includes(control.id)
          ? `<button class="button tile-footer__button button--remove-control" id="control-${control.id}" value="${control.cost}">Remove</button>`
          : control.cost <= spendAvailable
          ? `<button class="button tile-footer__button button--implement-control" id="control-${control.id}" value="${control.cost}">Implement</button>`
          : `<button class="button tile-footer__button" disabled id="control-${control.id}" value="">Insufficient Funds</button>`;

        data.push([
          `${control.number}&nbsp;${control.name}`,
          control.summary || control.description,
          formatter.format(control.cost),
          `${control.effectiveness}&nbsp;%`,
          securityAreas,
          controlButton,
        ]);
      });
      tableHTML = this._renderTable(headers, data);
    } else {
      tableHTML = "<p>No controls remaining; you've been busy!</p>";
    }

    $(`.modal#new-controls .modal__content`).html(tableHTML);
  }

  /**
   * Render a tile.
   *
   * @category Game
   *
   * @param id  The element ID for the tile.
   * @param header  The tile header content.
   * @param main  The main tile content.
   * @param footer  The tile footer content.
   * @param flags  Flags for customising the tile.
   * @return  The rendered tile HTML.
   */
  protected _renderTile(
    id: string,
    header: string,
    main: string,
    footer: string,
    flags: { selectable?: boolean; selected?: boolean } = {},
  ): string {
    const tileHTML = `<section class="tile tile--control${flags.selectable ? ' tile--selectable' : ''}${
      flags.selected ? ' tile--selected' : ''
    }" id="control-${id}-tile">`;

    let tileHeader = '<header class="tile__header">';
    tileHeader += header;
    tileHeader += '</header>';

    let tileMain = '<main class="tile__main">';
    tileMain += main;
    tileMain += '</main>';

    let tileFooter = '<footer class="tile__footer">';
    tileFooter += footer;
    tileFooter += '</footer>';

    return tileHTML + tileHeader + tileMain + tileFooter + '</section>';
  }

  /**
   * Render a table.
   *
   * @category Game
   *
   * @param headers  The table column headers.
   * @param rows  The row content.
   * @return  The rendered table HTML.
   */
  protected _renderTable(headers: string[], rows: string[][]): string {
    let tableHeader = `<table class="table table--${headers.length}-columns" id="implemented-controls__details">`;
    tableHeader += '<thead class="table__header"><tr class="table__row">';
    for (const header of headers) tableHeader += `<th class="table__cell table__header__cell">${header}</th>`;
    tableHeader += '</tr></thead>';

    let tableBody = '<tbody class="table__body">';
    for (const row of rows) {
      tableBody += '<tr class="table__row">';
      for (const cell of row) tableBody += `<td class="table__cell table__body__cell">${cell}</td>`;
      tableBody += '</tr>';
    }
    tableBody += '</tbody>';
    tableBody += '</table>';

    return tableHeader + tableBody;
  }

  /****************************************************************************
   * Helper functions.
   ****************************************************************************/

  /**
   * Construct a descriptive name for an event.
   *
   * @category Game
   * @category Base
   *
   * @param event  The event to describe.
   * @returns  The event name.
   */
  protected _generateEventName(event: Event): string {
    if (event.cost) {
      if (event.cost > 2500.0) {
        return 'A catastrophic incident';
      } else if (event.cost > 1500.0) {
        return 'A serious incident';
      } else if (event.cost > 800.0) {
        return 'An incident';
      } else return 'A minor incident';
    } else return 'An incident';
  }

  /**
   * Construct a narrative description of an event.
   *
   * @category Game
   * @category Base
   *
   * @param event  The event to describe.
   * @returns  The event description.
   */
  protected _generateEventDescription(event: Event): string {
    let description = '';
    const assetDesc = event.asset
      ? `Your <strong>${
          this._assets.find((asset) => {
            return asset.slug === event.asset;
          }).name
        }</strong> was`
      : 'You were';
    const threatActorDesc = event.threatActor
      ? `a <strong>${
          this._threatActors.find((threatActor) => {
            return threatActor.slug === event.threatActor;
          }).name
        }</strong>`
      : `an <strong>unknown threat actor</strong>`;

    if (event.securityAreas) {
      description += `${assetDesc} attacked by ${threatActorDesc}.<br><br>`;
      description += 'The attack was classified into the following area(s):<br><ul class="table__list">';
      for (const securityAreaId of event.securityAreas) {
        const securityArea: SecurityArea = this._securityAreas.find((securityArea) => {
          return String(securityArea.id) === String(securityAreaId);
        });
        description += `<li class="table__list__item">${securityArea.number}. ${securityArea.name}</li>`;
      }
      description += '</ul>';
      return description;
    } else return "<em>Something</em> bad has happened, but you don't know anything more than that.";
  }

  /**
   * Determines the maximum x,y dimensions for each environment.
   *
   * @category Game
   * @category Base
   *
   * @returns  The derived dimensions (see {@link _environmentDimensions}).
   */
  protected _getEnvironmentDimensions(): { office: { x: number; y: number }; internet: { x: number; y: number } } {
    let officeMaxX = 0,
      officeMaxY = 0,
      internetMaxX = 0,
      internetMaxY = 0;

    for (const asset of this._assets) {
      if (asset.location) {
        const splitLocation = asset.location.split('-');
        const environment = splitLocation[0];
        const x = Number(splitLocation[1]),
          y = Number(splitLocation[2]);

        if (environment === 'org') {
          officeMaxX = x > officeMaxX ? x : officeMaxX;
          officeMaxY = y > officeMaxY ? y : officeMaxY;
        } else if (environment === 'inet') {
          internetMaxX = x > internetMaxX ? x : internetMaxX;
          internetMaxY = y > internetMaxY ? y : internetMaxY;
        } else throw { code: 500, message: 'Unknown asset location' };
      }
    }

    return {
      office: {
        x: officeMaxX,
        y: officeMaxY,
      },
      internet: {
        x: internetMaxX,
        y: internetMaxY,
      },
    };
  }
}

/**
 * Represents the rendering service.
 *
 * @category Game
 * @category Multiplayer
 * @category Base
 * @category Services
 */
export abstract class BaseMultiPlayerRenderingService extends BaseRenderingService {
  // Nothing yet...
}
