import { ResourceTypeUtil, RESOURCE_TYPE } from './trading-type.const';

type STACK_TYPE = 'BUY_STACK' | 'SELL_STACK';
export type REDIS_TRADING_KEY_PAIR<STACK_T = any> = {
  NAME: string;
  /**
   * Redis Trading KEY
   */
  STREAM_KEY: string;
  GROUP_KEY: string;
  CONSUMER_KEY: string;

  /**
   * 체결되기를 기다리는 거래 데이터
   */
  PENDING_DATA: string;
  /**
   * 다음 체결될 데이터를 받을지 확인할 Flag 변수
   */
  NEXT_CONTRACT_READY: string;
  /**
   * Redis JSON Searching Index
   */
  SEARCH_INDEX: string;
  STACK: {
    [key in STACK_TYPE]: STACK_T;
  };
  TYPE_LIST?: number[];
};

export type MTKStackName = 'MTK_BUY_STACK' | 'MTK_SELL_STACK';
export type ResourceStackName = 'RESOURCE_BUY_STACK' | 'RESOURCE_SELL_STACK';
export type RareStackName = 'RARE_BUY_STACK' | 'RARE_SELL_STACK';

// *********************************************************************
// Keys for MTK
// *********************************************************************
// *********************************************************************
export const TRADING_KEYPAIR_MTK: REDIS_TRADING_KEY_PAIR<MTKStackName> = {
  NAME: 'TRADING_KEYPAIR_MTK',
  STREAM_KEY: 'MTK_TRADING_STREAM',
  GROUP_KEY: 'MTK_TRADING_GROUP',
  CONSUMER_KEY: 'MTK_TRADING_CONSUMER',
  PENDING_DATA: 'MTK_TRADING_PENDING',
  NEXT_CONTRACT_READY: 'MTK_NEXT_CONTRACT_READY',
  SEARCH_INDEX: 'MTK_TRADING_INDEX',
  STACK: {
    BUY_STACK: 'MTK_BUY_STACK',
    SELL_STACK: 'MTK_SELL_STACK',
  },
  TYPE_LIST: [null],
};

// *********************************************************************
// Keys for Resource
// *********************************************************************
// *********************************************************************
export const TRADING_KEYPAIR_RESOURCE: REDIS_TRADING_KEY_PAIR<ResourceStackName> =
  {
    NAME: 'TRADING_KEYPAIR_RESOURCE',
    STREAM_KEY: 'RESOURCE_TRADING_STREAM',
    GROUP_KEY: 'RESOURCE_TRADING_GROUP',
    CONSUMER_KEY: 'RESOURCE_TRADING_CONSUMER',
    PENDING_DATA: 'RESOURCE_TRADING_PENDING',
    NEXT_CONTRACT_READY: 'RESOURCE_NEXT_CONTRACT_READY',
    SEARCH_INDEX: 'RESOURCE_TRADING_INDEX',
    STACK: {
      BUY_STACK: 'RESOURCE_BUY_STACK',
      SELL_STACK: 'RESOURCE_SELL_STACK',
    },
    TYPE_LIST: Object.values(RESOURCE_TYPE).filter((val) =>
      ResourceTypeUtil.isNormal(val),
    ),
  };

// *********************************************************************
// Keys for Rare
// *********************************************************************
// *********************************************************************
export const TRADING_KEYPAIR_RARE: REDIS_TRADING_KEY_PAIR<RareStackName> = {
  NAME: 'TRADING_KEYPAIR_RARE',
  STREAM_KEY: 'RARE_TRADING_STREAM',
  GROUP_KEY: 'RARE_TRADING_GROUP',
  CONSUMER_KEY: 'RARE_TRADING_CONSUMER',
  PENDING_DATA: 'RARE_TRADING_PENDING',
  NEXT_CONTRACT_READY: 'RARE_NEXT_CONTRACT_READY',
  SEARCH_INDEX: 'RARE_TRADING_INDEX',
  STACK: {
    BUY_STACK: 'RARE_BUY_STACK',
    SELL_STACK: 'RARE_SELL_STACK',
  },
  TYPE_LIST: Object.values(RESOURCE_TYPE).filter((val) =>
    ResourceTypeUtil.isRare(val),
  ),
};

export const ENTIRE_KEYPAIR_LIST: REDIS_TRADING_KEY_PAIR[] = [
  TRADING_KEYPAIR_MTK,
  TRADING_KEYPAIR_RESOURCE,
  TRADING_KEYPAIR_RARE,
];

export const ENTIRE_KEYPAIR_MAP: { [k: string]: REDIS_TRADING_KEY_PAIR } = {
  TRADING_KEYPAIR_MTK,
  TRADING_KEYPAIR_RESOURCE,
  TRADING_KEYPAIR_RARE,
};

export const STREAM_SIZE_MAX_THRESHOLD = 12_0000;
export const STREAM_TRIM_CHUNK_SIZE = 10_000;
