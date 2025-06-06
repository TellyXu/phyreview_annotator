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
		log.Println("Warning: .env file not found")
	}

	// 初始化数据库连接
	db.InitDB()
	defer db.CloseDB()

	// 读取迁移文件
	migrationPath := filepath.Join("..", "..", "db", "migration_new_workflow.sql")
	migrationSQL, err := ioutil.ReadFile(migrationPath)
	if err != nil {
		log.Fatal("Failed to read migration file:", err)
	}

	// 执行迁移
	_, err = db.DB.Exec(string(migrationSQL))
	if err != nil {
		log.Fatal("Failed to execute migration:", err)
	}

	log.Println("Database migration completed successfully!")
}
