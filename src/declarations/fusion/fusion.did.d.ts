import type { Principal } from '@dfinity/principal';
export type BurnLiquidityActorResponse =
  | { Ok: BurnLiquidityResponse }
  | { Err: ErrorInfo };
export interface BurnLiquidityRequest {
  liquidity: bigint;
}
export interface BurnLiquidityResponse {
  pool_volume: bigint;
  user_liquidity: bigint;
  volume: bigint;
  pool_amount: bigint;
  amount: bigint;
  pool_liquidity: bigint;
}
export interface ErrorInfo {
  code: number;
  message: string;
}
export interface EventData {
  code: number;
  data: Array<number>;
  version: bigint;
}
export interface GetFusionEventsRequest {
  limit: number;
}
export interface GetFusionEventsResponse {
  left_count: number;
  events: Array<EventData>;
}
export type MintLiquidityActorResponse =
  | { Ok: BurnLiquidityRequest }
  | { Err: ErrorInfo };
export interface MintLiquidityRequest {
  volume: bigint;
  amount: bigint;
}
export interface MyOrderItem {
  id: OrderId;
  order_direction: OrderDirection;
  volume: bigint;
  created_at: bigint;
  filled: bigint;
  price: bigint;
}
export type OrderDirection = { Ask: null } | { Bid: null };
export interface OrderId {
  id: bigint;
}
export interface RemoveFusionEventsRequest {
  end_version_excluded: bigint;
  start_version_included: bigint;
}
export interface RemoveFusionEventsResponse {
  left_count: number;
}
export type Result = { Ok: boolean } | { Err: ErrorInfo };
export type Result_1 = { Ok: SwapInfoResponse } | { Err: ErrorInfo };
export type Result_2 = { Ok: Array<MyOrderItem> } | { Err: ErrorInfo };
export type Result_3 = { Ok: SubmitOrderResponse } | { Err: ErrorInfo };
export type Result_4 = { Ok: bigint } | { Err: ErrorInfo };
export interface SubmitOrderResponse {
  state_version: bigint;
  order_id: OrderId;
}
export interface SwapInfoResponse {
  pool_volume: bigint;
  user_liquidity: bigint;
  pool_amount: bigint;
  pool_liquidity: bigint;
}
export interface _SERVICE {
  burn_liquidity: (
    arg_0: BurnLiquidityRequest,
  ) => Promise<BurnLiquidityActorResponse>;
  cancel_all_orders: () => Promise<Result>;
  cancel_order: (arg_0: OrderId) => Promise<Result>;
  get_events: (
    arg_0: GetFusionEventsRequest,
  ) => Promise<GetFusionEventsResponse>;
  get_swap_info: () => Promise<Result_1>;
  get_user_orders: () => Promise<Result_2>;
  init_es: (
    arg_0: Principal,
    arg_1: number,
    arg_2: Principal,
    arg_3: number,
  ) => Promise<Result>;
  mint_liquidity: (
    arg_0: MintLiquidityRequest,
  ) => Promise<MintLiquidityActorResponse>;
  remove_events: (
    arg_0: RemoveFusionEventsRequest,
  ) => Promise<RemoveFusionEventsResponse>;
  submit_ask_limit_order: (arg_0: bigint, arg_1: bigint) => Promise<Result_3>;
  submit_bid_limit_order: (arg_0: bigint, arg_1: bigint) => Promise<Result_3>;
  version: () => Promise<Result_4>;
}
