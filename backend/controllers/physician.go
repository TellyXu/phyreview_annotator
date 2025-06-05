package controllers

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/phyreview_annotator/db"
	"github.com/phyreview_annotator/models"
)

// GetPhysicianByNPI 根据NPI号码获取医生信息
func GetPhysicianByNPI(c *gin.Context) {
	npiStr := c.Param("npi")
	npi, err := strconv.ParseInt(npiStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的NPI号码"})
		return
	}

	// 查询医生信息
	var physician models.Physician
	err = db.DB.QueryRow(`
		SELECT id, phy_id, npi, first_name, last_name, gender, credential, 
		specialty, practice_zip5, business_zip5, biography_doc, education_doc,
		num_reviews, doc_name, zip3, zip2, zipcode, state, region
		FROM physicians WHERE npi = $1
	`, npi).Scan(
		&physician.ID, &physician.PhyID, &physician.NPI, &physician.FirstName,
		&physician.LastName, &physician.Gender, &physician.Credential,
		&physician.Specialty, &physician.PracticeZip5, &physician.BusinessZip5,
		&physician.BiographyDoc, &physician.EducationDoc, &physician.NumReviews,
		&physician.DocName, &physician.Zip3, &physician.Zip2, &physician.Zipcode,
		&physician.State, &physician.Region,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "未找到该医生信息"})
			return
		}
		log.Println("查询医生信息错误:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询数据库出错"})
		return
	}

	// 查询医生的评论
	rows, err := db.DB.Query(`
		SELECT id, physician_id, review_index, source, date, text
		FROM reviews WHERE physician_id = $1
		ORDER BY review_index
	`, physician.ID)
	if err != nil {
		log.Println("查询评论错误:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询评论出错"})
		return
	}
	defer rows.Close()

	reviews := []models.Review{}
	for rows.Next() {
		var review models.Review
		var dateStr string
		err := rows.Scan(
			&review.ID, &review.PhysicianID, &review.ReviewIndex,
			&review.Source, &dateStr, &review.Text,
		)
		if err != nil {
			log.Println("扫描评论数据错误:", err)
			continue
		}

		// 解析日期字符串
		if dateStr != "" {
			// 尝试多种日期格式
			formats := []string{
				"2006-01-02 15:04:05",
				"2006-01-02T15:04:05Z",
				"2006-01-02T15:04:05.000000Z",
				"2006-01-02 15:04:05.000000",
			}

			var parsed bool
			for _, format := range formats {
				if date, err := time.Parse(format, dateStr); err == nil {
					review.Date = date
					parsed = true
					break
				}
			}

			if !parsed {
				log.Printf("无法解析日期: %s", dateStr)
			}
		}

		reviews = append(reviews, review)
	}

	physician.Reviews = reviews
	c.JSON(http.StatusOK, physician)
}

// GetPhysicianTask 获取医生的任务信息
func GetPhysicianTask(c *gin.Context) {
	npiStr := c.Param("npi")
	taskIDStr := c.Param("taskID")
	username := c.Query("username")

	if username == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少用户名参数"})
		return
	}

	npi, err := strconv.ParseInt(npiStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的NPI号码"})
		return
	}

	taskID, err := strconv.Atoi(taskIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的任务ID"})
		return
	}

	// 先通过NPI获取医生ID
	var physicianID int
	err = db.DB.QueryRow("SELECT id FROM physicians WHERE npi = $1", npi).Scan(&physicianID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "未找到该医生信息"})
			return
		}
		log.Println("查询医生ID错误:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询数据库出错"})
		return
	}

	// 查询任务信息
	var task models.Task
	err = db.DB.QueryRow(`
		SELECT id, physician_id, status, assigned_to
		FROM tasks WHERE id = $1 AND physician_id = $2
	`, taskID, physicianID).Scan(
		&task.ID, &task.PhysicianID, &task.Status, &task.AssignedTo,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			// 如果任务不存在，创建新任务
			_, err = db.DB.Exec(`
				INSERT INTO tasks (id, physician_id, status, assigned_to)
				VALUES ($1, $2, 'pending', $3)
			`, taskID, physicianID, username)
			if err != nil {
				log.Println("创建任务错误:", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "创建任务出错"})
				return
			}
			task = models.Task{
				ID:          taskID,
				PhysicianID: physicianID,
				Status:      "pending",
				AssignedTo:  username,
			}
		} else {
			log.Println("查询任务错误:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "查询任务出错"})
			return
		}
	} else if task.AssignedTo != username {
		// 更新任务指派人
		_, err = db.DB.Exec("UPDATE tasks SET assigned_to = $1 WHERE id = $2", username, taskID)
		if err != nil {
			log.Println("更新任务指派人错误:", err)
		}
		task.AssignedTo = username
	}

	// 查询模型标注
	rows, err := db.DB.Query(`
		SELECT id, model_name, trait, score, consistency, sufficiency, evidence
		FROM model_annotations
		WHERE physician_id = $1
	`, physicianID)
	if err != nil {
		log.Println("查询模型标注错误:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询模型标注出错"})
		return
	}
	defer rows.Close()

	modelAnnotations := []models.ModelAnnotation{}
	for rows.Next() {
		var annotation models.ModelAnnotation
		err := rows.Scan(
			&annotation.ID, &annotation.ModelName, &annotation.Trait,
			&annotation.Score, &annotation.Consistency, &annotation.Sufficiency,
			&annotation.Evidence,
		)
		if err != nil {
			log.Println("扫描模型标注数据错误:", err)
			continue
		}
		annotation.PhysicianID = physicianID
		modelAnnotations = append(modelAnnotations, annotation)
	}

	c.JSON(http.StatusOK, gin.H{
		"task":              task,
		"model_annotations": modelAnnotations,
	})
}

// SubmitHumanAnnotation 提交人类标注结果
func SubmitHumanAnnotation(c *gin.Context) {
	var annotations []models.HumanAnnotation
	if err := c.ShouldBindJSON(&annotations); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(annotations) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "没有提供标注数据"})
		return
	}

	// 开始事务
	tx, err := db.DB.Begin()
	if err != nil {
		log.Println("开始事务错误:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "数据库事务错误"})
		return
	}

	for _, annotation := range annotations {
		// 插入或更新标注
		_, err := tx.Exec(`
			INSERT INTO human_annotations 
			(physician_id, evaluator, task_id, trait, score, consistency, sufficiency, evidence, timestamp)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
			ON CONFLICT (physician_id, evaluator, task_id, trait) 
			DO UPDATE SET 
			score = EXCLUDED.score, 
			consistency = EXCLUDED.consistency,
			sufficiency = EXCLUDED.sufficiency,
			evidence = EXCLUDED.evidence,
			timestamp = EXCLUDED.timestamp
		`,
			annotation.PhysicianID, annotation.Evaluator, annotation.TaskID,
			annotation.Trait, annotation.Score, annotation.Consistency,
			annotation.Sufficiency, annotation.Evidence, time.Now())

		if err != nil {
			tx.Rollback()
			log.Println("插入标注错误:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "保存标注数据出错"})
			return
		}
	}

	// 提交事务
	err = tx.Commit()
	if err != nil {
		log.Println("提交事务错误:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "提交事务出错"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "标注提交成功"})
}

// SubmitModelRanking 提交模型排名
func SubmitModelRanking(c *gin.Context) {
	var ranking models.ModelRanking
	if err := c.ShouldBindJSON(&ranking); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ranking.Timestamp = time.Now()

	// 插入或更新排名
	_, err := db.DB.Exec(`
		INSERT INTO model_rankings 
		(physician_id, task_id, evaluator, model_ranks, convinced, error_model, timestamp)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (physician_id, task_id, evaluator) 
		DO UPDATE SET 
		model_ranks = EXCLUDED.model_ranks,
		convinced = EXCLUDED.convinced,
		error_model = EXCLUDED.error_model,
		timestamp = EXCLUDED.timestamp
	`,
		ranking.PhysicianID, ranking.TaskID, ranking.Evaluator,
		ranking.ModelRanks, ranking.Convinced, ranking.ErrorModel, ranking.Timestamp)

	if err != nil {
		log.Println("插入排名错误:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "保存排名数据出错"})
		return
	}

	// 更新任务状态为已完成
	_, err = db.DB.Exec("UPDATE tasks SET status = 'completed' WHERE id = $1 AND physician_id = $2",
		ranking.TaskID, ranking.PhysicianID)
	if err != nil {
		log.Println("更新任务状态错误:", err)
	}

	c.JSON(http.StatusOK, gin.H{"message": "排名提交成功"})
}
