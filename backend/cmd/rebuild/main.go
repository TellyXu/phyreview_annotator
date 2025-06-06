package main

import (
	"io/ioutil"
	"log"
	"path/filepath"

	"github.com/joho/godotenv"
	"github.com/phyreview_annotator/db"
)

func main() {
	// 加载环境变量
	err := godotenv.Load("../../.env")
	if err != nil {
		log.Println("Warning: .env file not found, using environment variables")
	}

	// 初始化数据库连接
	db.InitDB()
	defer db.CloseDB()

	// 读取重建脚本
	scriptPath := filepath.Join("..", "..", "db", "rebuild_database.sql")
	scriptSQL, err := ioutil.ReadFile(scriptPath)
	if err != nil {
		log.Fatal("Failed to read rebuild script:", err)
	}

	log.Println("Starting database rebuild...")

	// 执行重建脚本
	_, err = db.DB.Exec(string(scriptSQL))
	if err != nil {
		log.Fatal("Failed to execute rebuild script:", err)
	}

	log.Println("Database rebuild completed successfully!")
	log.Println("Test data inserted:")
	log.Println("- NPI: 1043259971")
	log.Println("- Task ID: 1")
	log.Println("- Username: test_user")
}
