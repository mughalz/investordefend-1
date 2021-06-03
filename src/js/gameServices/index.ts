/**
 * This module re-exports game type-specific services for neater importing.
 *
 * @see GameService
 * @see GameType
 *
 * @category Game
 * @category Services
 * @category Re-export
 *
 * @module GameServices
 *
 * @hidden
 */

import { SinglePlayerGameService, SinglePlayerRenderingService } from './singlePlayerGame.service';
import { CooperativeGameService, CooperativeRenderingService } from './cooperativeGame.service';
import { CompetitiveGameService, CompetitiveRenderingService } from './competitiveGame.service';

export {
  SinglePlayerGameService,
  SinglePlayerRenderingService,
  CooperativeGameService,
  CooperativeRenderingService,
  CompetitiveGameService,
  CompetitiveRenderingService,
};
