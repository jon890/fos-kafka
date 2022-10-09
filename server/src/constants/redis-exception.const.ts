export enum RedisException {
  INDEX_ALREADY_EXIST = 'Index already exists',
  UNKNOWN_INDEX_NAME = 'Unknown Index name',
  CONSUMER_GROUP_NAME_ALREADY_EXIST = 'BUSYGROUP Consumer Group name already exists',
}

export class RedisExpcetionParser {
  static parse(m: string): RedisException {
    return Object.values(RedisException).find((v) => v === m);
  }
}
