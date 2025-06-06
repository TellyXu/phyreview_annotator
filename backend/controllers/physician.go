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

// GetTraitProgress 获取指定trait的进度状态
func GetTraitProgress(c *gin.Context) {
	npiStr := c.Param("npi")
	taskIDStr := c.Param("taskID")
	trait := c.Param("trait")
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

	// 获取医生ID
	var physicianID int
	err = db.DB.QueryRow("SELECT id FROM physicians WHERE npi = $1", npi).Scan(&physicianID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "未找到该医生信息"})
		return
	}

	// 查询trait进度
	var progress models.TraitProgress
	err = db.DB.QueryRow(`
		SELECT id, physician_id, task_id, evaluator, trait, 
		human_annotation_completed, machine_evaluation_completed, review_completed, timestamp
		FROM trait_progress 
		WHERE physician_id = $1 AND task_id = $2 AND evaluator = $3 AND trait = $4
	`, physicianID, taskID, username, trait).Scan(
		&progress.ID, &progress.PhysicianID, &progress.TaskID, &progress.Evaluator,
		&progress.Trait, &progress.HumanAnnotationCompleted, &progress.MachineEvaluationCompleted,
		&progress.ReviewCompleted, &progress.Timestamp,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			// 如果记录不存在，检查是否有人类标注
			var hasHumanAnnotation bool
			err = db.DB.QueryRow(`
				SELECT EXISTS(
					SELECT 1 FROM human_annotations
					WHERE physician_id = $1 AND task_id = $2 AND evaluator = $3 AND trait = $4
				)
			`, physicianID, taskID, username, trait).Scan(&hasHumanAnnotation)

			if err != nil {
				log.Println("检查人类标注记录错误:", err)
				// 如果检查失败，返回默认进度
				progress = models.TraitProgress{
					PhysicianID:                physicianID,
					TaskID:                     taskID,
					Evaluator:                  username,
					Trait:                      trait,
					HumanAnnotationCompleted:   false,
					MachineEvaluationCompleted: false,
					ReviewCompleted:            false,
				}
			} else if hasHumanAnnotation {
				// 如果有人类标注但没有进度记录，创建一个进度记录
				log.Println("检测到人类标注但没有对应的进度记录，创建进度记录")

				// 开始事务
				tx, err := db.DB.Begin()
				if err != nil {
					log.Println("开始事务错误:", err)
					// 返回默认进度，但标记人类标注已完成
					progress = models.TraitProgress{
						PhysicianID:                physicianID,
						TaskID:                     taskID,
						Evaluator:                  username,
						Trait:                      trait,
						HumanAnnotationCompleted:   true,
						MachineEvaluationCompleted: false,
						ReviewCompleted:            false,
					}
				} else {
					// 插入新进度记录
					_, err = tx.Exec(`
						INSERT INTO trait_progress
						(physician_id, task_id, evaluator, trait, human_annotation_completed, machine_evaluation_completed, review_completed, timestamp)
						VALUES ($1, $2, $3, $4, true, false, false, $5)
					`, physicianID, taskID, username, trait, time.Now())

					if err != nil {
						tx.Rollback()
						log.Println("创建进度记录错误:", err)
						// 返回默认进度，但标记人类标注已完成
						progress = models.TraitProgress{
							PhysicianID:                physicianID,
							TaskID:                     taskID,
							Evaluator:                  username,
							Trait:                      trait,
							HumanAnnotationCompleted:   true,
							MachineEvaluationCompleted: false,
							ReviewCompleted:            false,
						}
					} else {
						// 提交事务
						err = tx.Commit()
						if err != nil {
							log.Println("提交事务错误:", err)
							// 返回默认进度，但标记人类标注已完成
							progress = models.TraitProgress{
								PhysicianID:                physicianID,
								TaskID:                     taskID,
								Evaluator:                  username,
								Trait:                      trait,
								HumanAnnotationCompleted:   true,
								MachineEvaluationCompleted: false,
								ReviewCompleted:            false,
							}
						} else {
							// 查询新创建的记录
							err = db.DB.QueryRow(`
								SELECT id, physician_id, task_id, evaluator, trait, 
								human_annotation_completed, machine_evaluation_completed, review_completed, timestamp
								FROM trait_progress 
								WHERE physician_id = $1 AND task_id = $2 AND evaluator = $3 AND trait = $4
							`, physicianID, taskID, username, trait).Scan(
								&progress.ID, &progress.PhysicianID, &progress.TaskID, &progress.Evaluator,
								&progress.Trait, &progress.HumanAnnotationCompleted, &progress.MachineEvaluationCompleted,
								&progress.ReviewCompleted, &progress.Timestamp,
							)

							if err != nil {
								log.Println("查询新创建的进度记录错误:", err)
								// 返回默认进度，但标记人类标注已完成
								progress = models.TraitProgress{
									PhysicianID:                physicianID,
									TaskID:                     taskID,
									Evaluator:                  username,
									Trait:                      trait,
									HumanAnnotationCompleted:   true,
									MachineEvaluationCompleted: false,
									ReviewCompleted:            false,
								}
							}
						}
					}
				}
			} else {
				// 如果没有人类标注记录，返回默认进度
				progress = models.TraitProgress{
					PhysicianID:                physicianID,
					TaskID:                     taskID,
					Evaluator:                  username,
					Trait:                      trait,
					HumanAnnotationCompleted:   false,
					MachineEvaluationCompleted: false,
					ReviewCompleted:            false,
				}
			}
		} else {
			// 如果是其他错误，返回默认进度
			log.Println("查询trait进度错误 (使用默认值):", err)
			progress = models.TraitProgress{
				PhysicianID:                physicianID,
				TaskID:                     taskID,
				Evaluator:                  username,
				Trait:                      trait,
				HumanAnnotationCompleted:   false,
				MachineEvaluationCompleted: false,
				ReviewCompleted:            false,
			}
		}
	}

	// 检查是否有任何一个条件下返回的进度的ID仍然为0，如果是，确保这是一个有效的默认对象
	if progress.ID == 0 {
		// 检查人类标注是否已完成
		var hasHumanAnnotation bool
		err = db.DB.QueryRow(`
			SELECT EXISTS(
				SELECT 1 FROM human_annotations
				WHERE physician_id = $1 AND task_id = $2 AND evaluator = $3 AND trait = $4
			)
		`, physicianID, taskID, username, trait).Scan(&hasHumanAnnotation)

		if err == nil && hasHumanAnnotation {
			// 确保标记为人类标注已完成
			progress.HumanAnnotationCompleted = true
		}

		// 检查机器评价是否已完成
		var hasMachineEvaluation bool
		err = db.DB.QueryRow(`
			SELECT EXISTS(
				SELECT 1 FROM machine_annotation_evaluation
				WHERE physician_id = $1 AND task_id = $2 AND evaluator = $3 AND trait = $4
			)
		`, physicianID, taskID, username, trait).Scan(&hasMachineEvaluation)

		if err == nil && hasMachineEvaluation {
			// 确保标记为机器评价已完成
			progress.MachineEvaluationCompleted = true
		}
	}

	c.JSON(http.StatusOK, progress)
}

// SubmitTraitHumanAnnotation 提交单个trait的人类标注
func SubmitTraitHumanAnnotation(c *gin.Context) {
	npiStr := c.Param("npi")
	taskIDStr := c.Param("taskID")
	trait := c.Param("trait")

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

	// 获取医生ID
	var physicianID int
	err = db.DB.QueryRow("SELECT id FROM physicians WHERE npi = $1", npi).Scan(&physicianID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "未找到该医生信息"})
		return
	}

	var annotation models.HumanAnnotation
	if err := c.ShouldBindJSON(&annotation); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 开始事务
	tx, err := db.DB.Begin()
	if err != nil {
		log.Println("开始事务错误:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "数据库事务错误"})
		return
	}

	// 插入或更新人类标注
	_, err = tx.Exec(`
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
		physicianID, annotation.Evaluator, taskID, trait,
		annotation.Score, annotation.Consistency, annotation.Sufficiency,
		annotation.Evidence, time.Now())

	if err != nil {
		tx.Rollback()
		log.Println("插入标注错误:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "保存标注数据出错"})
		return
	}

	// 首先检查progress记录是否存在
	var progressExists bool
	err = tx.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM trait_progress 
			WHERE physician_id = $1 AND task_id = $2 AND evaluator = $3 AND trait = $4
		)
	`, physicianID, taskID, annotation.Evaluator, trait).Scan(&progressExists)

	if err != nil {
		tx.Rollback()
		log.Println("检查进度记录是否存在错误:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "检查进度记录出错"})
		return
	}

	currentTime := time.Now()

	if progressExists {
		// 如果记录存在，更新它
		_, err = tx.Exec(`
			UPDATE trait_progress 
			SET human_annotation_completed = true, timestamp = $1
			WHERE physician_id = $2 AND task_id = $3 AND evaluator = $4 AND trait = $5
		`, currentTime, physicianID, taskID, annotation.Evaluator, trait)
	} else {
		// 如果记录不存在，创建新记录
		_, err = tx.Exec(`
			INSERT INTO trait_progress 
			(physician_id, task_id, evaluator, trait, human_annotation_completed, machine_evaluation_completed, review_completed, timestamp)
			VALUES ($1, $2, $3, $4, true, false, false, $5)
		`, physicianID, taskID, annotation.Evaluator, trait, currentTime)
	}

	if err != nil {
		tx.Rollback()
		log.Println("更新或创建trait进度错误:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新进度出错"})
		return
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

// GetTraitMachineAnnotations 获取指定trait的所有机器标注
func GetTraitMachineAnnotations(c *gin.Context) {
	npiStr := c.Param("npi")
	trait := c.Param("trait")

	npi, err := strconv.ParseInt(npiStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的NPI号码"})
		return
	}

	// 获取医生ID
	var physicianID int
	err = db.DB.QueryRow("SELECT id FROM physicians WHERE npi = $1", npi).Scan(&physicianID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "未找到该医生信息"})
		return
	}

	// 查询指定trait的机器标注
	rows, err := db.DB.Query(`
		SELECT id, model_name, trait, score, consistency, sufficiency, evidence
		FROM model_annotations
		WHERE physician_id = $1 AND trait = $2
		ORDER BY model_name
	`, physicianID, trait)

	annotations := []models.ModelAnnotation{}

	if err != nil {
		log.Println("查询机器标注错误 (返回空数组):", err)
		// 如果查询失败（比如表不存在），返回空数组而不是错误
		c.JSON(http.StatusOK, annotations)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var annotation models.ModelAnnotation
		err := rows.Scan(
			&annotation.ID, &annotation.ModelName, &annotation.Trait,
			&annotation.Score, &annotation.Consistency, &annotation.Sufficiency,
			&annotation.Evidence,
		)
		if err != nil {
			log.Println("扫描机器标注数据错误:", err)
			continue
		}
		annotation.PhysicianID = physicianID
		annotations = append(annotations, annotation)
	}

	c.JSON(http.StatusOK, annotations)
}

// SubmitMachineAnnotationEvaluation 提交对机器标注的评价
func SubmitMachineAnnotationEvaluation(c *gin.Context) {
	npiStr := c.Param("npi")
	taskIDStr := c.Param("taskID")
	trait := c.Param("trait")

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

	// 获取医生ID
	var physicianID int
	err = db.DB.QueryRow("SELECT id FROM physicians WHERE npi = $1", npi).Scan(&physicianID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "未找到该医生信息"})
		return
	}

	var evaluations []models.MachineAnnotationEvaluation
	if err := c.ShouldBindJSON(&evaluations); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 开始事务
	tx, err := db.DB.Begin()
	if err != nil {
		log.Println("开始事务错误:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "数据库事务错误"})
		return
	}

	for _, evaluation := range evaluations {
		// 插入或更新机器标注评价
		_, err := tx.Exec(`
			INSERT INTO machine_annotation_evaluation
			(model_annotation_id, physician_id, task_id, evaluator, trait, model_name, rating, comment, timestamp)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
			ON CONFLICT (model_annotation_id, evaluator, task_id) 
			DO UPDATE SET 
			rating = EXCLUDED.rating,
			comment = EXCLUDED.comment,
			timestamp = EXCLUDED.timestamp
		`,
			evaluation.ModelAnnotationID, physicianID, taskID, evaluation.Evaluator,
			trait, evaluation.ModelName, evaluation.Rating, evaluation.Comment, time.Now())

		if err != nil {
			tx.Rollback()
			log.Println("插入机器标注评价错误:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "保存评价数据出错"})
			return
		}
	}

	// 检查progress记录是否存在
	var progressExists bool
	err = tx.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM trait_progress 
			WHERE physician_id = $1 AND task_id = $2 AND evaluator = $3 AND trait = $4
		)
	`, physicianID, taskID, evaluations[0].Evaluator, trait).Scan(&progressExists)

	if err != nil {
		tx.Rollback()
		log.Println("检查进度记录是否存在错误:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "检查进度记录出错"})
		return
	}

	currentTime := time.Now()

	if progressExists {
		// 如果记录存在，更新它
		_, err = tx.Exec(`
			UPDATE trait_progress 
			SET machine_evaluation_completed = true, timestamp = $1
			WHERE physician_id = $2 AND task_id = $3 AND evaluator = $4 AND trait = $5
		`, currentTime, physicianID, taskID, evaluations[0].Evaluator, trait)
	} else {
		// 检查是否有人类标注记录
		var hasHumanAnnotation bool
		err = tx.QueryRow(`
			SELECT EXISTS(
				SELECT 1 FROM human_annotations
				WHERE physician_id = $1 AND task_id = $2 AND evaluator = $3 AND trait = $4
			)
		`, physicianID, taskID, evaluations[0].Evaluator, trait).Scan(&hasHumanAnnotation)

		if err != nil {
			tx.Rollback()
			log.Println("检查人类标注记录错误:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "检查人类标注记录出错"})
			return
		}

		// 如果记录不存在，创建新记录
		_, err = tx.Exec(`
			INSERT INTO trait_progress 
			(physician_id, task_id, evaluator, trait, human_annotation_completed, machine_evaluation_completed, review_completed, timestamp)
			VALUES ($1, $2, $3, $4, $5, true, false, $6)
		`, physicianID, taskID, evaluations[0].Evaluator, trait, hasHumanAnnotation, currentTime)
	}

	if err != nil {
		tx.Rollback()
		log.Println("更新或创建trait进度错误:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新进度出错"})
		return
	}

	// 提交事务
	err = tx.Commit()
	if err != nil {
		log.Println("提交事务错误:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "提交事务出错"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "评价提交成功"})
}

// GetTraitHistory 获取该trait的历史标注和评价
func GetTraitHistory(c *gin.Context) {
	npiStr := c.Param("npi")
	taskIDStr := c.Param("taskID")
	trait := c.Param("trait")
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

	// 获取医生ID
	var physicianID int
	err = db.DB.QueryRow("SELECT id FROM physicians WHERE npi = $1", npi).Scan(&physicianID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "未找到该医生信息"})
		return
	}

	// 查询人类标注历史
	var humanAnnotation models.HumanAnnotation
	err = db.DB.QueryRow(`
		SELECT id, physician_id, evaluator, task_id, trait, score, consistency, sufficiency, evidence, timestamp
		FROM human_annotations
		WHERE physician_id = $1 AND task_id = $2 AND evaluator = $3 AND trait = $4
	`, physicianID, taskID, username, trait).Scan(
		&humanAnnotation.ID, &humanAnnotation.PhysicianID, &humanAnnotation.Evaluator,
		&humanAnnotation.TaskID, &humanAnnotation.Trait, &humanAnnotation.Score,
		&humanAnnotation.Consistency, &humanAnnotation.Sufficiency, &humanAnnotation.Evidence,
		&humanAnnotation.Timestamp,
	)

	var hasHumanAnnotation bool
	if err != nil && err != sql.ErrNoRows {
		log.Println("查询人类标注历史错误:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询历史数据出错"})
		return
	}
	hasHumanAnnotation = (err == nil)

	// 查询机器标注评价历史
	rows, err := db.DB.Query(`
		SELECT id, model_annotation_id, physician_id, task_id, evaluator, trait, model_name, rating, comment, timestamp
		FROM machine_annotation_evaluation
		WHERE physician_id = $1 AND task_id = $2 AND evaluator = $3 AND trait = $4
	`, physicianID, taskID, username, trait)
	if err != nil {
		log.Println("查询机器标注评价历史错误:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询评价历史出错"})
		return
	}
	defer rows.Close()

	evaluations := []models.MachineAnnotationEvaluation{}
	for rows.Next() {
		var evaluation models.MachineAnnotationEvaluation
		err := rows.Scan(
			&evaluation.ID, &evaluation.ModelAnnotationID, &evaluation.PhysicianID,
			&evaluation.TaskID, &evaluation.Evaluator, &evaluation.Trait,
			&evaluation.ModelName, &evaluation.Rating, &evaluation.Comment,
			&evaluation.Timestamp,
		)
		if err != nil {
			log.Println("扫描机器标注评价数据错误:", err)
			continue
		}
		evaluations = append(evaluations, evaluation)
	}

	result := gin.H{
		"machine_evaluations": evaluations,
	}

	if hasHumanAnnotation {
		result["human_annotation"] = humanAnnotation
	}

	c.JSON(http.StatusOK, result)
}

// CompleteTraitReview 完成trait回顾阶段
func CompleteTraitReview(c *gin.Context) {
	npiStr := c.Param("npi")
	taskIDStr := c.Param("taskID")
	trait := c.Param("trait")

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

	// 获取医生ID
	var physicianID int
	err = db.DB.QueryRow("SELECT id FROM physicians WHERE npi = $1", npi).Scan(&physicianID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "未找到该医生信息"})
		return
	}

	var requestData struct {
		Evaluator string `json:"evaluator"`
		Comment   string `json:"comment,omitempty"`
	}
	if err := c.ShouldBindJSON(&requestData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 开始事务
	tx, err := db.DB.Begin()
	if err != nil {
		log.Println("开始事务错误:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "数据库事务错误"})
		return
	}

	// 检查progress记录是否存在
	var progressExists bool
	err = tx.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM trait_progress 
			WHERE physician_id = $1 AND task_id = $2 AND evaluator = $3 AND trait = $4
		)
	`, physicianID, taskID, requestData.Evaluator, trait).Scan(&progressExists)

	if err != nil {
		tx.Rollback()
		log.Println("检查进度记录是否存在错误:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "检查进度记录出错"})
		return
	}

	currentTime := time.Now()

	if progressExists {
		// 如果记录存在，更新它
		_, err = tx.Exec(`
			UPDATE trait_progress 
			SET review_completed = true, timestamp = $1
			WHERE physician_id = $2 AND task_id = $3 AND evaluator = $4 AND trait = $5
		`, currentTime, physicianID, taskID, requestData.Evaluator, trait)
	} else {
		// 检查前置条件
		var hasHumanAnnotation, hasMachineEvaluation bool

		// 检查是否有人类标注记录
		err = tx.QueryRow(`
			SELECT EXISTS(
				SELECT 1 FROM human_annotations
				WHERE physician_id = $1 AND task_id = $2 AND evaluator = $3 AND trait = $4
			)
		`, physicianID, taskID, requestData.Evaluator, trait).Scan(&hasHumanAnnotation)

		if err != nil {
			tx.Rollback()
			log.Println("检查人类标注记录错误:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "检查人类标注记录出错"})
			return
		}

		// 检查是否有机器评价记录
		err = tx.QueryRow(`
			SELECT EXISTS(
				SELECT 1 FROM machine_annotation_evaluation
				WHERE physician_id = $1 AND task_id = $2 AND evaluator = $3 AND trait = $4
			)
		`, physicianID, taskID, requestData.Evaluator, trait).Scan(&hasMachineEvaluation)

		if err != nil {
			tx.Rollback()
			log.Println("检查机器评价记录错误:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "检查机器评价记录出错"})
			return
		}

		// 如果记录不存在，创建新记录
		_, err = tx.Exec(`
			INSERT INTO trait_progress 
			(physician_id, task_id, evaluator, trait, human_annotation_completed, machine_evaluation_completed, review_completed, timestamp)
			VALUES ($1, $2, $3, $4, $5, $6, true, $7)
		`, physicianID, taskID, requestData.Evaluator, trait, hasHumanAnnotation, hasMachineEvaluation, currentTime)
	}

	if err != nil {
		tx.Rollback()
		log.Println("更新或创建trait进度错误:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新进度出错"})
		return
	}

	// 提交事务
	err = tx.Commit()
	if err != nil {
		log.Println("提交事务错误:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "提交事务出错"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "trait完成成功"})
}
