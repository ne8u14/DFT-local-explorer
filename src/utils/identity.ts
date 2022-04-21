import { exec } from 'shelljs';
import { Identity } from '@dfinity/agent';
import * as fs from 'fs';
import { Secp256k1KeyIdentity } from '@dfinity/identity';
import * as sha256 from 'sha256';
import { Principal } from '@dfinity/principal';
import { toHexString } from '@dfinity/identity/lib/cjs/buffer';
import { get_dfx_json } from './dfxJson';
import { get_id } from '../declarations/dft_basic';
import { sha224 } from 'js-sha256';
import crc from 'crc';

export function load(name: string): Identity {
  //new_dfx_identity(name);
  // get current home directory
  const home = process.env.HOME;
  const pem_path = `${home}/.config/dfx/identity/${name}/identity.pem`;
  const rawKey = fs
    .readFileSync(pem_path)
    .toString()
    .replace('-----BEGIN EC PRIVATE KEY-----', '')
    .replace('-----END EC PRIVATE KEY-----', '')
    .trim();

  const privKey = Uint8Array.from(sha256(rawKey, { asBytes: true }));
  // Initialize an identity from the secret key
  return Secp256k1KeyIdentity.fromSecretKey(Uint8Array.from(privKey).buffer);
}

export interface agentOptions {
  host: string;
  identity: Identity;
}

export interface IdentityInfo {
  identity: Identity;
  principalText: string;
  agentOptions: agentOptions;
}

export interface CanisterInfo {
  principal: Principal;
  name: string;
  principalText: string;
}

const DEFAULT_HOST = 'http://127.0.0.1:8000';
export const IDENTITIES = [
  'dft_main',
  'dft_miner',
  'dft_user1',
  'dft_user2',
  'dft_user3',
  'dft_receiver',
  'dft_fee_charger',
];
export const DEFAULT_IDENTITY = IDENTITIES[0];
export const new_dfx_identity = (name: string) => {
  exec(`dfx identity new ${name}`, { silent: false });
};
export const createIdentities = () => {
  IDENTITIES.forEach(new_dfx_identity);
};
class IdentityFactory {
  private _identities: Map<string, IdentityInfo>;

  private _canisters: Map<string, CanisterInfo>;

  constructor() {
    this._identities = new Map<string, IdentityInfo>();
    this._canisters = new Map<string, CanisterInfo>();
  }

  private loadIdentityInfo = (name: string) => {
    const identity = load(name);
    const principal = identity.getPrincipal();
    const identityInfo: IdentityInfo = {
      identity: identity,
      principalText: principal.toText(),
      agentOptions: {
        host: DEFAULT_HOST,
        identity: identity,
      },
    };
    this._identities.set(name, identityInfo);
  };
  loadAllCanisters = () => {
    const canisterNames = this.getCanisterNames();
    for (const canisterName of canisterNames) {
      const canisterInfo: CanisterInfo = {
        name: canisterName,
        principalText: get_id(canisterName),
        principal: Principal.fromText(get_id(canisterName)),
      };

      this._canisters.set(canisterName, canisterInfo);
    }
  };

  getDefaultHost = () => {
    return DEFAULT_HOST;
  };

  loadAllIdentities() {
    IDENTITIES.forEach(this.loadIdentityInfo);
  }

  getIdentity = (name?: string): IdentityInfo | undefined => {
    return this._identities.get(name || DEFAULT_IDENTITY);
  };

  getPrincipals = (): { principal: Principal; name: string }[] => {
    const principals: { principal: Principal; name: string }[] = [];
    this._identities.forEach((identityInfo, Name) => {
      principals.push({
        principal: identityInfo.identity.getPrincipal(),
        name: Name,
      });
    });
    return principals;
  };

  getCanisterNames = (): string[] => {
    const canisters: string[] = [];
    const dfx_json = get_dfx_json();
    dfx_json.canisters.forEach((canister, name) => {
      canisters.push(name);
    });
    return canisters;
  };

  getCanisters = (): CanisterInfo[] => {
    const canisters: CanisterInfo[] = [];
    this._canisters.forEach((canisterInfo, name) => {
      canisters.push(canisterInfo);
    });
    return canisters;
  };

  getNameById = (id: string): string => {
    const principals = this.getPrincipals();
    const principal = principals.find(
      (principal) => principalToAccountID(principal.principal) === id,
    );
    //if principal is not found, find in canisters
    if (!principal) {
      const canisters = this.getCanisters();
      const canister = canisters.find(
        (canister) => principalToAccountID(canister.principal) === id,
      );
      if (canister) {
        return canister.name;
      }
    }

    return principal?.name ?? id;
  };

  getPrincipalNameById = (id: string): string => {
    const principals = this.getPrincipals();
    const principal = principals.find(
      (principal) => principalToAccountID(principal.principal) === id,
    );

    return principal?.name ?? id;
  };

  getPrincipal = (name?: string): Principal | undefined => {
    const identityInfo = this.getIdentity(name || DEFAULT_IDENTITY);
    if (identityInfo) {
      return identityInfo.identity.getPrincipal();
    }
    return undefined;
  };

  // getAccountIdHex = (name?: string, index?: number): string | undefined => {
  //   const identityInfo = this.getIdentity(name || DEFAULT_IDENTITY);
  //   if (identityInfo) {
  //     const principal = identityInfo.identity.getPrincipal();
  //     const accountIdUint8 = principalToAccountIDInBytes(
  //       principal,
  //       this.getSubAccount(index ?? 0),
  //     );
  //     return toHexString(accountIdUint8);
  //   }
  //   return undefined;
  // };
  //
  // getAccountIdBytes = (
  //   name?: string,
  //   index?: number,
  // ): Array<number> | undefined => {
  //   const identityInfo = this.getIdentity(name || DEFAULT_IDENTITY);
  //   if (identityInfo) {
  //     const principal = identityInfo.identity.getPrincipal();
  //     const accountIdUint8 = principalToAccountIDInBytes(principal);
  //     return Array.from(accountIdUint8);
  //   }
  //   return undefined;
  // };

  getSubAccount = (index: number) => {
    const subAccount = new Uint8Array(32).fill(0);
    subAccount[0] = index;
    return subAccount;
  };
}

export const asciiStringToByteArray = (text: string): Array<number> => {
  return Array.from(text).map((c) => c.charCodeAt(0));
};

export const toHexString2 = (bytes: Uint8Array) =>
  bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

export const hexToBytes = (hex: string): Array<number> => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return Array.from(bytes);
};
export const arrayOfNumberToUint8Array = (
  numbers: Array<number>,
): Uint8Array => {
  return new Uint8Array(numbers);
};

export const arrayOfNumberToArrayBuffer = (
  numbers: Array<number>,
): ArrayBuffer => {
  return arrayOfNumberToUint8Array(numbers).buffer;
};

export const principalToAccountIDInBytes = (
  principal: Principal,
  subAccount?: Uint8Array,
): Uint8Array => {
  // Hash (sha224) the principal, the subAccount and some padding
  const padding = asciiStringToByteArray('\x0Aaccount-id');

  const shaObj = sha224.create();
  shaObj.update([
    ...padding,
    ...principal.toUint8Array(),
    ...(subAccount ?? Array(32).fill(0)),
  ]);
  const hash = new Uint8Array(shaObj.array());

  // Prepend the checksum of the hash and convert to a hex string
  const checksum = calculateCrc32(hash);
  return new Uint8Array([...checksum, ...hash]);
};

export const principalToAccountID = (
  principal: Principal,
  subAccount?: Uint8Array,
): string => {
  const bytes = principalToAccountIDInBytes(principal, subAccount);
  return toHexString(bytes);
};

export const calculateCrc32 = (bytes: Uint8Array): Uint8Array => {
  const checksumArrayBuf = new ArrayBuffer(4);
  const view = new DataView(checksumArrayBuf);
  view.setUint32(0, crc.crc32(Buffer.from(bytes)), false);
  return Buffer.from(checksumArrayBuf);
};

export const identityFactory = new IdentityFactory();
identityFactory.loadAllIdentities();
identityFactory.loadAllCanisters();
