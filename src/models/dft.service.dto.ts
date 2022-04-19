import { Principal } from '@dfinity/principal';

export class TransferDto {
  to: string;
  fee: bigint;
  value: bigint;
  from: string;
  caller: string;
  createAt: bigint;
  height: number;
}

export class ApproveDto {
  fee: bigint;
  value: bigint;
  owner: string;
  caller: Principal;
  spender: string;
  createAt: bigint;
  height: number;
}

export class FeeToModifyDto {
  newFeeTo: string;
  caller: Principal;
  createAt: bigint;
  height: number;
}
export class OwnerModifyDto {
  newOwner: Principal;
  caller: Principal;
  createAt: bigint;
  height: number;
}
