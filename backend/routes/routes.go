package routes

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
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

		// 提交人类标注（旧版本，保持兼容性）
		api.POST("/annotations", controllers.SubmitHumanAnnotation)

		// 新的trait相关路由
		// 获取trait进度
		api.GET("/physician/:npi/task/:taskID/trait/:trait/progress", controllers.GetTraitProgress)

		// 提交单个trait的人类标注
		api.POST("/physician/:npi/task/:taskID/trait/:trait/human-annotation", controllers.SubmitTraitHumanAnnotation)

		// 获取指定trait的机器标注
		api.GET("/physician/:npi/task/:taskID/trait/:trait/machine-annotations", controllers.GetTraitMachineAnnotations)

		// 提交机器标注评价
		api.POST("/physician/:npi/task/:taskID/trait/:trait/machine-evaluation", controllers.SubmitMachineAnnotationEvaluation)

		// 获取trait历史数据
		api.GET("/physician/:npi/task/:taskID/trait/:trait/history", controllers.GetTraitHistory)

		// 完成trait回顾
		api.POST("/physician/:npi/task/:taskID/trait/:trait/complete", controllers.CompleteTraitReview)
	}

	return r
}
