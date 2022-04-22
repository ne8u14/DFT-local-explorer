import type { Principal } from '@dfinity/principal';
export interface ErrorInfo { 'code' : number, 'message' : string }
export type Result = { 'Ok' : bigint } |
  { 'Err' : ErrorInfo };
export interface _SERVICE {
  'trigger_event_processing' : () => Promise<undefined>,
  'version' : () => Promise<Result>,
}
