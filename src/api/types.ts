export type SecurityType =
  | 'EQUITY'
  | 'ETF'
  | 'ADR'
  | 'CRYPTO'
  | 'OPTION'
  | 'MULTI_LEG_INSTRUMENT'
  | 'ALT'
  | 'TREASURY'
  | 'BOND'
  | 'INDEX'
  | 'UNDERLYING_SECURITY_FOR_INDEX_OPTION';

export type TradingStatus =
  | 'BUY_AND_SELL'
  | 'BUY_ONLY'
  | 'SELL_ONLY'
  | 'LIQUIDATION_ONLY'
  | 'DISABLED'
  | 'NONE';

export interface Instrument {
  symbol: string;
  name?: string;
  type: string;
}

export interface InstrumentInfo {
  symbol: string;
  type: SecurityType;
}
