/**
 * Barrel — machines à états (INV-22).
 * Source de vérité des transitions : ce dossier. Les enums Prisma et
 * shared/api-contracts/src/enums.ts ne définissent que l'alphabet des états.
 *
 * Usage typique :
 *   assertMatchTransition(match.status as MatchState, 'FINISHED_VALIDATED');
 *   assertBetTransition(bet.status as BetState, 'ESCROWED');
 */
export * from './match.state-machine';
export * from './ticket.state-machine';
export * from './payment.state-machine';
export * from './game-server.state-machine';
export * from './sanction.state-machine';
export * from './bet.state-machine';
export * from './bet-market.state-machine';
