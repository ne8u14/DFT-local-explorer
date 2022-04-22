export const idlFactory = ({ IDL }) => {
  const ErrorInfo = IDL.Record({ 'code' : IDL.Nat32, 'message' : IDL.Text });
  const Result = IDL.Variant({ 'Ok' : IDL.Nat64, 'Err' : ErrorInfo });
  return IDL.Service({
    'trigger_event_processing' : IDL.Func([], [], ['oneway']),
    'version' : IDL.Func([], [Result], ['query']),
  });
};
export const init = ({ IDL }) => { return []; };
