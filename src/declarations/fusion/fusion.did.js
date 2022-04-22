export const idlFactory = ({ IDL }) => {
  const BurnLiquidityRequest = IDL.Record({ liquidity: IDL.Nat });
  const BurnLiquidityResponse = IDL.Record({
    pool_volume: IDL.Nat,
    user_liquidity: IDL.Nat,
    volume: IDL.Nat,
    pool_amount: IDL.Nat,
    amount: IDL.Nat,
    pool_liquidity: IDL.Nat,
  });
  const ErrorInfo = IDL.Record({ code: IDL.Nat32, message: IDL.Text });
  const BurnLiquidityActorResponse = IDL.Variant({
    Ok: BurnLiquidityResponse,
    Err: ErrorInfo,
  });
  const Result = IDL.Variant({ Ok: IDL.Bool, Err: ErrorInfo });
  const OrderId = IDL.Record({ id: IDL.Nat });
  const GetFusionEventsRequest = IDL.Record({ limit: IDL.Nat32 });
  const EventData = IDL.Record({
    code: IDL.Nat8,
    data: IDL.Vec(IDL.Nat8),
    version: IDL.Nat64,
  });
  const GetFusionEventsResponse = IDL.Record({
    left_count: IDL.Nat32,
    events: IDL.Vec(EventData),
  });
  const SwapInfoResponse = IDL.Record({
    pool_volume: IDL.Nat,
    user_liquidity: IDL.Nat,
    pool_amount: IDL.Nat,
    pool_liquidity: IDL.Nat,
  });
  const Result_1 = IDL.Variant({ Ok: SwapInfoResponse, Err: ErrorInfo });
  const OrderDirection = IDL.Variant({ Ask: IDL.Null, Bid: IDL.Null });
  const MyOrderItem = IDL.Record({
    id: OrderId,
    order_direction: OrderDirection,
    volume: IDL.Nat,
    created_at: IDL.Nat64,
    filled: IDL.Nat,
    price: IDL.Nat,
  });
  const Result_2 = IDL.Variant({
    Ok: IDL.Vec(MyOrderItem),
    Err: ErrorInfo,
  });
  const MintLiquidityRequest = IDL.Record({
    volume: IDL.Nat,
    amount: IDL.Nat,
  });
  const MintLiquidityActorResponse = IDL.Variant({
    Ok: BurnLiquidityRequest,
    Err: ErrorInfo,
  });
  const RemoveFusionEventsRequest = IDL.Record({
    end_version_excluded: IDL.Nat64,
    start_version_included: IDL.Nat64,
  });
  const RemoveFusionEventsResponse = IDL.Record({ left_count: IDL.Nat32 });
  const SubmitOrderResponse = IDL.Record({
    state_version: IDL.Nat64,
    order_id: OrderId,
  });
  const Result_3 = IDL.Variant({
    Ok: SubmitOrderResponse,
    Err: ErrorInfo,
  });
  const Result_4 = IDL.Variant({ Ok: IDL.Nat64, Err: ErrorInfo });
  return IDL.Service({
    burn_liquidity: IDL.Func(
      [BurnLiquidityRequest],
      [BurnLiquidityActorResponse],
      [],
    ),
    cancel_all_orders: IDL.Func([], [Result], []),
    cancel_order: IDL.Func([OrderId], [Result], []),
    get_events: IDL.Func(
      [GetFusionEventsRequest],
      [GetFusionEventsResponse],
      ['query'],
    ),
    get_swap_info: IDL.Func([], [Result_1], ['query']),
    get_user_orders: IDL.Func([], [Result_2], ['query']),
    init_es: IDL.Func(
      [IDL.Principal, IDL.Nat8, IDL.Principal, IDL.Nat8],
      [Result],
      [],
    ),
    mint_liquidity: IDL.Func(
      [MintLiquidityRequest],
      [MintLiquidityActorResponse],
      [],
    ),
    remove_events: IDL.Func(
      [RemoveFusionEventsRequest],
      [RemoveFusionEventsResponse],
      [],
    ),
    submit_ask_limit_order: IDL.Func([IDL.Nat, IDL.Nat], [Result_3], []),
    submit_bid_limit_order: IDL.Func([IDL.Nat, IDL.Nat], [Result_3], []),
    version: IDL.Func([], [Result_4], ['query']),
  });
};
export const init = ({ IDL }) => {
  return [];
};
