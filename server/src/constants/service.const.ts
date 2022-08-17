/**
 * 다른 외부 서비스를 정의
 * MicroService 나 Database 등을 정의한 상수
 */
export const OUTER_SERVICE = {
  REDIS_TRADING: {
    name: 'redis-local', // docker container name
    port: 6379,
  },
};
