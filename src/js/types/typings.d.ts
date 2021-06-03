/**
 * This module defines additional types.
 *
 * @category Types
 *
 * @module TypeDefinitions
 *
 * @hidden
 */

import { GameState, GameType, AssetLocation } from '../_helpers/enums';

/**
 * A user.
 */
export type User = {
  id: string;
  username: string;
  name: string;
};

/**
 * A game instance.
 */
export interface Game {
  id: string;
  currentTurn: number;
  maxTurns: number;
  moneyPerTurn: number;
  showAvailableControls: boolean;
  organisations: Organisation[];
  readyOrganisations: string[];
  state: GameState;
  gameType: GameType;
  votes?: {
    id: string;
    votes: string[];
  }[];
}

/**
 * A game tutorial.
 */
export type Tutorial = {
  state: GameState | null;
  text: string;
};

/**
 * A set of server-defined game settings.
 */
export type GameSettings = {
  assets: Asset[];
  threatActors: ThreatActor[];
  securityAreas: SecurityArea[];
  tutorials: Tutorial[];
};

/*eslint-disable @typescript-eslint/ban-types */
/**
 * A pollable callback.
 */
export type Poll = {
  callback: Function;
  args: any[];
};
/*eslint-enable @typescript-eslint/ban-types */

/**
 * A set of all pollable callbacks.
 */
export type Polls = Record<string, Poll>;

/**
 * A vote (in a co-operative game).
 */
export type Votes = {
  id: string;
  votes: string[];
};

/**
 * A vote summary (in a co-operative game).
 */
export type VoteSummary = {
  votes: {
    id: string;
    votes: number;
    hasVoted: boolean;
  }[];
  threshold: number;
};

/**
 * An organisation within a game.
 *
 * @todo Extend to cover non-joined organisations.
 */
export interface Organisation {
  id: string;
  name: string;
  balance: number;
  events: Event[];
  members: string[];
  mitigatedEvents: string[];
  controls: Control[];
  mitigations: Record<string, number>[];
}

/**
 * An asset onto which controls and events can be placed.
 */
export type Asset = {
  slug: string;
  name: string;
  description: string;
  img: string;
  location?: AssetLocation;
};

/**
 * The threat actor responsible for an incident.
 */
export type ThreatActor = {
  slug: string;
  name: string;
  includeFrom?: number;
  includeWarningShown?: boolean;
  description?: string;
  img?: string;
};

/**
 * An event that has been experienced by an organisation.
 */
export interface Event {
  id: string;
  cost: number;
  turn: number;
  asset: string;
  threatActor: string;
  mitigated: boolean;
  mitigatedBy?: string;
  mitigatedCost?: number;
  securityAreas: SecurityArea[];
}

/**
 * A control that has been implemented by an organisation.
 */
export interface Control {
  id: string;
  number: string;
  name: string;
  summary?: string;
  description?: string;
  img?: string;
  cost: number;
  effectiveness: number;
  asset?: string;
  effect?: {
    description: string;
    script: string;
  };
  source?: string;
  turnImplemented: number;
  mitigation: number;
  securityAreas: SecurityArea[];
}

/**
 * A security area by which events and controls can be classified.
 */
export type SecurityArea = {
  id: string;
  number: string;
  name: string;
  summary?: string;
  description?: string;
  source: string;
  parent?: SecurityArea[];
};

/**
 * An admin-configurable game setting.
 */
export type Setting = {
  id: string;
  key: string;
  value: any;
  description?: string;
};
