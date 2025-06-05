package main

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/phyreview_annotator/db"
	"github.com/phyreview_annotator/routes"
)

func main() {
	// 加载环境变量
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: .env file not found")
	}

	// 初始化数据库连接
	db.InitDB()
	defer db.CloseDB()

	// 设置路由
	r := routes.SetupRouter()

	// 获取服务端口
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// 启动服务
	log.Printf("Server starting on port %s\n", port)
	err = r.Run(fmt.Sprintf(":%s", port))
	if err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
} 