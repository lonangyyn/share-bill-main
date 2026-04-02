package database

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Store định nghĩa tất cả các hàm để thực thi db queries và transactions
type Store interface {
	Querier 
	ExecTx(ctx context.Context, fn func(*Queries) error) error // Chạy tran, rollback khi ko success
}

type SQLStore struct {
	*Queries
	connPool *pgxpool.Pool
}

func NewStore(connPool *pgxpool.Pool) Store {
	return &SQLStore{
		Queries:  New(connPool),
		connPool: connPool,
	}
}

func (store *SQLStore) ExecTx(ctx context.Context, fn func(*Queries) error) error {
	tx, err := store.connPool.Begin(ctx)
	if err != nil {
		return err
	}

	q := New(tx) 
	err = fn(q)
	if err != nil {
		if rbErr := tx.Rollback(ctx); rbErr != nil {
			return fmt.Errorf("tx err: %v, rb err: %v", err, rbErr)
		}
		return err
	}

	return tx.Commit(ctx)
}