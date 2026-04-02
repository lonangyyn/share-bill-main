package db

import (
	"context"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
)

type RedisClient struct {
	Client *redis.Client
}

func NewRedisClient(addr string, password string, db int) *RedisClient {
	rdb := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password,
		DB:       db,
	})
	return &RedisClient{Client: rdb}
}

func (r *RedisClient) SetOTP(ctx context.Context, email string, otp string, duration time.Duration) error {
	key := "otp:" + email
	return r.Client.Set(ctx, key, otp, duration).Err()
}

func (r *RedisClient) GetOTP(ctx context.Context, email string) (string, error) {
	key := "otp:" + email
	return r.Client.Get(ctx, key).Result()
}

func (r *RedisClient) DeleteOTP(ctx context.Context, email string) error {
	key := "otp:" + email
	return r.Client.Del(ctx, key).Err()
}

// Increment resend count key and set TTL if first increment. Returns the new counter value.
func (r *RedisClient) IncrResendCount(ctx context.Context, email string, duration time.Duration) (int64, error) {
	key := "otp_resend:" + email
	cnt, err := r.Client.Incr(ctx, key).Result()
	if err != nil { return 0, err }
	if cnt == 1 {
		// First time, set expiration window
		_ = r.Client.Expire(ctx, key, duration).Err()
	}
	return cnt, nil
}

// Luu refresh token jti -> userID tren redis
func (r *RedisClient) SetRefreshToken(ctx context.Context, jti string, userID int64, duration time.Duration) error {
    key := "rt:" + jti
    return r.Client.Set(ctx, key, strconv.FormatInt(userID, 10), duration).Err()
} 

// Lay userID tu redis bang jti
func (r *RedisClient) GetRefreshToken(ctx context.Context, jti string) (string, error) {
    key := "rt:" + jti
    return r.Client.Get(ctx, key).Result()
} 

// Xoa refresh token jti khoi redis
func (r *RedisClient) DeleteRefreshToken(ctx context.Context, jti string) error {
    key := "rt:" + jti
    return r.Client.Del(ctx, key).Err()
} 