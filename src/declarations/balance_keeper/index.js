import { Actor, HttpAgent } from '@dfinity/agent';

// Imports and re-exports candid interface
import { idlFactory } from './balance_keeper.did.js';
import logger from 'node-color-log';
import { get_id } from '../dft_basic';

export { idlFactory } from './balance_keeper.did.js';
// CANISTER_ID is replaced by webpack based on node environment
export const canisterId = process.env.BALANCE_KEEPER_CANISTER_ID;

/**
 *
 * @param {string | import("@dfinity/principal").Principal} canisterId Canister ID of Agent
 * @param {{agentOptions?: import("@dfinity/agent").HttpAgentOptions; actorOptions?: import("@dfinity/agent").ActorConfig}} [options]
 * @return {import("@dfinity/agent").ActorSubclass<import("./balance_keeper.did.js")._SERVICE>}
 */
export const createActor = (canisterId, options) => {
  const agent = new HttpAgent({ ...options?.agentOptions });
  // Fetch root key for certificate validation during development
  if (process.env.NODE_ENV !== 'production') {
    agent.fetchRootKey().catch((err) => {
      console.warn(
        'Unable to fetch root key. Check to ensure that your local replica is running',
      );
      console.error(err);
    });
  }

  // Creates an actor with using the candid interface and the HttpAgent
  return Actor.createActor(idlFactory, {
    agent,
    canisterId,
    ...options?.actorOptions,
  });
};

export const createLocalActorByName = (name) => {
  const canisterId = get_id(name);
  return createActor(canisterId, {
    agentOptions: { host: 'http://127.0.0.1:8000' },
  });
};
