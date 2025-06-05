package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
	"github.com/joho/godotenv"
)

var DB *sql.DB

// InitDB 初始化数据库连接
func InitDB() {
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: .env file not found")
	}

	// 从环境变量获取数据库连接信息
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USER", "postgres")
	dbPassword := getEnv("DB_PASSWORD", "postgres")
	dbName := getEnv("DB_NAME", "phyreview")
	sslMode := getEnv("DB_SSLMODE", "disable")

	// 构建连接字符串
	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		dbHost, dbPort, dbUser, dbPassword, dbName, sslMode)

	// 连接数据库
	var dbErr error
	DB, dbErr = sql.Open("postgres", connStr)
	if dbErr != nil {
		log.Fatal("Failed to connect to database: ", dbErr)
	}

	// 测试连接
	if err := DB.Ping(); err != nil {
		log.Fatal("Failed to ping database: ", err)
	}

	log.Println("Successfully connected to database")
}

// CloseDB 关闭数据库连接
func CloseDB() {
	if DB != nil {
		DB.Close()
	}
}

// 获取环境变量，如果不存在则使用默认值
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
} 