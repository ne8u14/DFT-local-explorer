import { cd, exec } from 'shelljs';
import { Principal } from '@dfinity/principal';
import { sha224 } from 'js-sha256';
import { toHexString } from '@dfinity/identity/lib/cjs/buffer';
import crc from 'crc';

export const get_id = (name) => {
  cd(`/workspaces/ex3/src`);
  //get current nodejs process path
  const path = exec('pwd', { silent: true }).stdout.trim();
  return exec(`dfx canister id ${name}`, { silent: true }).stdout.trim();
};

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
