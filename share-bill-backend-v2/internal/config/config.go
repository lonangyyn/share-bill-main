package config

import (
	"fmt"
	"time"

	"github.com/spf13/viper"
)

type Config struct {
	DBSource            string        `mapstructure:"DB_SOURCE"`
	ServerAddress       string        `mapstructure:"SERVER_ADDRESS"`
	JWTSecret           string        `mapstructure:"JWT_SECRET"`
	TokenDuration       time.Duration `mapstructure:"TOKEN_DURATION"`
	RefreshTokenDuration time.Duration `mapstructure:"REFRESH_TOKEN_DURATION"`

	// Redis
	RedisAddress  string `mapstructure:"REDIS_ADDRESS"`
	RedisPassword string `mapstructure:"REDIS_PASSWORD"`
	RedisDb       int    `mapstructure:"REDIS_DB"`

	// Email (SMTP)
	EmailSenderName     string `mapstructure:"EMAIL_SENDER_NAME"`
	EmailSenderAddress  string `mapstructure:"EMAIL_SENDER_ADDRESS"`
	EmailSenderPassword string `mapstructure:"EMAIL_SENDER_PASSWORD"`

	CloudinaryURL string `mapstructure:"CLOUDINARY_URL"`
}

func LoadConfig(path string) (config Config, err error) {
	viper.AddConfigPath(path)
	viper.SetConfigFile(".env")
	viper.AutomaticEnv() 
	// Bind de chay trong docker
	viper.BindEnv("DB_SOURCE")
	viper.BindEnv("SERVER_ADDRESS")
	viper.BindEnv("JWT_SECRET")
	viper.BindEnv("TOKEN_DURATION")
	viper.BindEnv("REFRESH_TOKEN_DURATION")
	viper.BindEnv("REDIS_ADDRESS")
	viper.BindEnv("REDIS_PASSWORD")
	viper.BindEnv("REDIS_DB")
	viper.BindEnv("EMAIL_SENDER_NAME")
	viper.BindEnv("EMAIL_SENDER_ADDRESS")
	viper.BindEnv("EMAIL_SENDER_PASSWORD")
	viper.BindEnv("CLOUDINARY_URL")

	err = viper.ReadInConfig()
	if err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); ok {
			fmt.Println("Config file not found. Using Environment Variables (BindEnv).")
		} else {
			fmt.Println("Warning reading config file:", err)
		}
	}
	err = viper.Unmarshal(&config)
	return
}