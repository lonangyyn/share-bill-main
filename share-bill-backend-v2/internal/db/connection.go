package db

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func NewDatabase(dbSource string) *pgxpool.Pool {
	config, err := pgxpool.ParseConfig(dbSource)
	if err != nil {
		log.Fatal("Unable to parse database config:", err)
	}
	config.MaxConns = 20                       
	config.MinConns = 2                        
	config.MaxConnLifetime = time.Hour         
	config.MaxConnIdleTime = 30 * time.Minute  

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		log.Fatal("Unable to create connection pool:", err)
	}
	err = pool.Ping(ctx)
	if err != nil {
		log.Fatal("Cannot connect to database (Ping failed):", err)
	}

	fmt.Println("Successfully connected to PostgreSQL")
	return pool
}