/**
 * This module collects various enumerations used throughout the project to
 * aid code readbility.
 *
 * @category Helpers
 *
 * @module Enums
 */

/**
 * Represents possible state values that can be assigned to games.
 *
 * The game loop runs as follows:
 *
 * - Purchasing:
 *   - users are given money to spend on controls; and
 *   - purchasing decisions are revocable.
 * - Placing:
 *   - players' control purchases are locked in; and
 *   - players have to correctly assign their new controls to their assets.
 * - Simulating:
 *   - any remaining money becomes investment into their organisation;
 *   - Monte Carlo simulation(s) are run to generate events for the turn; and
 *   - those events are applied to the organisation(s) in the game to assess
 *     costs.
 * - Results:
 *   - players review the results of the last turn; but
 *   - this is not used server-side, but is included here so that this enum
 *     mirrors the client-side enum.
 * - Ended:
 *   - players review the overall results of their game and their final score; and
 *   - no further actions may be taken.
 */
export enum GameState {
  Purchasing = 0,
  Placing = 4,
  Simulating = 1,
  Results = 2,
  Ended = 3,
}

/**
 * Represents possible game type values that can be assigned to games.
 *
 * The game types are as follows:
 *
 * - SinglePlayer:
 *   - one organisation, one player.
 * - Cooperative:
 *   - one organisation, multiple players;
 *   - players vote on action to take.
 * - Competitive:
 *   - multiple organisations, one player per organisation.
 */
export enum GameType {
  SinglePlayer,
  Cooperative,
  Competitive,
}

/**
 * The environments into which assets can be placed.
 *
 * @todo Clean up this and {@link AssetLocations}.
 */
export enum AssetLocation {
  Organisation = 'organisation',
  Internet = 'internet',
}

/**
 * The environments into which assets can be placed.
 *
 * @todo Clean up this and {@link AssetLocation}.
 */
export const AssetLocations = {
  organisation: {
    slug: 'organisation',
    name: 'Organisation',
    description: 'Your organisation.',
    img: 'office-header.png',
  },
  internet: {
    slug: 'internet',
    name: 'The Internet',
    description: 'The big wide online world.',
    img: 'internet-header.png',
  },
};
