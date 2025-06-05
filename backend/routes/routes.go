package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/gin-contrib/cors"
	"github.com/phyreview_annotator/controllers"
)

// SetupRouter 配置API路由
func SetupRouter() *gin.Engine {
	r := gin.Default()

	// 配置CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// 健康检查路由
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})

	// API路由组
	api := r.Group("/api")
	{
		// 获取医生信息
		api.GET("/physician/:npi", controllers.GetPhysicianByNPI)
		
		// 获取医生任务
		api.GET("/physician/:npi/task/:taskID", controllers.GetPhysicianTask)
		
		// 提交人类标注
		api.POST("/annotations", controllers.SubmitHumanAnnotation)
		
		// 提交模型排名
		api.POST("/rankings", controllers.SubmitModelRanking)
	}

	return r
} 