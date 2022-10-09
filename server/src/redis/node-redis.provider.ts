import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SchemaFieldTypes } from 'redis';
import { CONFIG_KEY } from 'src/constants/config.const';
import { INJECT_TOKEN } from 'src/constants/inject.token';
import {
  RedisException,
  RedisExpcetionParser,
} from 'src/constants/redis-exception.const';
import {
  ENTIRE_KEYPAIR_LIST,
  REDIS_TRADING_KEY_PAIR,
} from 'src/constants/redis-key.const';

// issue from : https://github.com/redis/node-redis/issues/1673
export type RedisClientType = ReturnType<typeof createClient>;

export const NodeRedisProvivderFacatory = {
  inject: [ConfigService],
  provide: INJECT_TOKEN.NODE_REDIS_PROVIDER,
  useFactory: async (
    configService: ConfigService,
  ): Promise<RedisClientType> => {
    const host = configService.get<string>(CONFIG_KEY.REDIS_HOST);
    const port = configService.get<string>(CONFIG_KEY.REDIS_PORT);

    const client = createClient({
      url: `redis://${host}:${port}`,
    });

    await client.connect();
    const redisClientSetup = async (keypair: REDIS_TRADING_KEY_PAIR) => {
      try {
        await client.xGroupCreate(keypair.STREAM_KEY, keypair.GROUP_KEY, '$', {
          MKSTREAM: true,
        });
        Logger.debug('Create Group Success');
      } catch (e) {
        const exception = RedisExpcetionParser.parse(e.message);

        if (exception === RedisException.CONSUMER_GROUP_NAME_ALREADY_EXIST) {
          // ignore
        }
      }

      try {
        await client.xGroupCreateConsumer(
          keypair.STREAM_KEY,
          keypair.GROUP_KEY,
          keypair.CONSUMER_KEY,
        );
        Logger.debug('Create Group Consumer Success');
      } catch (e) {
        const exception = RedisExpcetionParser.parse(e.message);

        if (exception === RedisException.CONSUMER_GROUP_NAME_ALREADY_EXIST) {
          // ignore
        }
      }

      try {
        await client.ft.CREATE(
          // @ts-ignore
          keypair.SEARCH_INDEX,
          {
            '$.category': {
              type: SchemaFieldTypes.TEXT,
              AS: 'category',
            },
            '$.id': {
              type: SchemaFieldTypes.TEXT,
              AS: 'id',
              SORTABLE: true,
            },
            '$.tradingType': {
              type: SchemaFieldTypes.TEXT,
              AS: 'tradingType',
            },
            '$.userId': {
              type: SchemaFieldTypes.TEXT,
              AS: 'userId',
            },
            '$.amount': {
              type: SchemaFieldTypes.NUMERIC,
              AS: 'amount',
              SORTABLE: true,
            },
            '$.price': {
              type: SchemaFieldTypes.NUMERIC,
              AS: 'price',
              SORTABLE: true,
            },
            '$.type': {
              type: SchemaFieldTypes.TEXT,
              AS: 'type',
            },
          },
          { ON: 'JSON', FILTER: `@category=="${keypair.NAME}"` },
        );
        Logger.debug('Create Search Index Success');
      } catch (e) {}
    };

    for (const keypair of ENTIRE_KEYPAIR_LIST) {
      await redisClientSetup(keypair);
    }

    return client;
  },
};
