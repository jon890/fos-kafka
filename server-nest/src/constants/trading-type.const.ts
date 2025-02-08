export enum TradingCategory {
  MTK = 'MTK',
  RESOURCE = 'RESOURCE',
  RARE = 'RARE',
}

export enum TradingType {
  BUYING = 'BUYING',
  SELLING = 'SELLING',
  CANCEL_BUYING = 'CANCEL_BUYING',
  CANCEL_SELLING = 'CANCEL_SELLING',
}

export class TradingTypeUtil {
  /**
   * 거래 스택에 있는 데이터인지 단언한다
   */
  static assertInTradingStack(tradingType: TradingType) {
    if (
      tradingType === TradingType.BUYING ||
      tradingType === TradingType.SELLING
    ) {
      // not to do
    } else {
      throw new Error(`거래 가능한 타입이 아닙니다 ===> ${tradingType}`);
    }
  }

  static assertInCancelType(tradingType: TradingType) {
    if (
      tradingType === TradingType.CANCEL_BUYING ||
      tradingType === TradingType.CANCEL_SELLING
    ) {
      // not to do
    } else {
      throw new Error(`취소 가능한 타입이 아닙니다 ===> ${tradingType}`);
    }
  }

  static getRedisFilter(tradingType: TradingType) {
    return `@tradingType:${tradingType}`;
  }
}

export const RESOURCE_TYPE = {
  IRON: 1001,
  STONE: 1002,
  WATER: 1003,
  OIL: 1004,
  UNIDENTIFIED_RARE: 1091,
  GOLD: 1081,
};

export class ResourceTypeUtil {
  static isNormal(resourceType: number) {
    if (
      resourceType == RESOURCE_TYPE.IRON ||
      resourceType == RESOURCE_TYPE.STONE ||
      resourceType == RESOURCE_TYPE.WATER ||
      resourceType == RESOURCE_TYPE.OIL
    ) {
      return true;
    } else {
      return false;
    }
  }

  static isRare(resourceType: number) {
    if (
      resourceType == RESOURCE_TYPE.UNIDENTIFIED_RARE ||
      resourceType == RESOURCE_TYPE.GOLD
    ) {
      return true;
    } else {
      return false;
    }
  }
}
