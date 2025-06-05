package models

import (
	"time"
)

// Physician 医生信息表
type Physician struct {
	ID            int     `json:"id"`
	PhyID         int64   `json:"phy_id"`
	NPI           int64   `json:"npi"`
	FirstName     string  `json:"first_name"`
	LastName      string  `json:"last_name"`
	Gender        string  `json:"gender"`
	Credential    string  `json:"credential"`
	Specialty     string  `json:"specialty"`
	PracticeZip5  string  `json:"practice_zip5"`
	BusinessZip5  string  `json:"business_zip5"`
	BiographyDoc  string  `json:"biography_doc"`
	EducationDoc  string  `json:"education_doc"`
	NumReviews    int     `json:"num_reviews"`
	DocName       string  `json:"doc_name"`
	Zip3          string  `json:"zip3"`
	Zip2          string  `json:"zip2"`
	Zipcode       string  `json:"zipcode"`
	State         string  `json:"state"`
	Region        string  `json:"region"`
	Reviews       []Review `json:"reviews,omitempty" gorm:"foreignKey:PhysicianID"`
}

// Review 评论信息表
type Review struct {
	ID           int       `json:"id"`
	PhysicianID  int       `json:"physician_id"`
	ReviewIndex  int       `json:"review_index"`
	Source       string    `json:"source"`
	Date         time.Time `json:"date"`
	Text         string    `json:"text"`
}

// ModelAnnotation 模型人格标注表
type ModelAnnotation struct {
	ID          int    `json:"id"`
	PhysicianID int    `json:"physician_id"`
	ModelName   string `json:"model_name"`
	Trait       string `json:"trait"`
	Score       string `json:"score"`
	Consistency string `json:"consistency"`
	Sufficiency string `json:"sufficiency"`
	Evidence    string `json:"evidence"`
}

// ModelEvaluation 人类对模型输出的评价
type ModelEvaluation struct {
	ID                int       `json:"id"`
	ModelAnnotationID int       `json:"model_annotation_id"`
	Evaluator         string    `json:"evaluator"`
	AccuracyScore     string    `json:"accuracy_score"`
	Comment           string    `json:"comment"`
	Timestamp         time.Time `json:"timestamp"`
}

// HumanAnnotation 人类标注结果
type HumanAnnotation struct {
	ID          int       `json:"id"`
	PhysicianID int       `json:"physician_id"`
	Evaluator   string    `json:"evaluator"`
	TaskID      int       `json:"task_id"`
	Trait       string    `json:"trait"`
	Score       int       `json:"score"`
	Consistency int       `json:"consistency"`
	Sufficiency int       `json:"sufficiency"`
	Evidence    string    `json:"evidence"`
	Timestamp   time.Time `json:"timestamp"`
}

// ModelRanking 模型排名
type ModelRanking struct {
	ID          int       `json:"id"`
	PhysicianID int       `json:"physician_id"`
	TaskID      int       `json:"task_id"`
	Evaluator   string    `json:"evaluator"`
	ModelRanks  string    `json:"model_ranks"` // JSON格式的模型排名
	Convinced   bool      `json:"convinced"`
	ErrorModel  string    `json:"error_model"` // 有明显错误的模型
	Timestamp   time.Time `json:"timestamp"`
}

// Task 任务信息
type Task struct {
	ID          int    `json:"id"`
	PhysicianID int    `json:"physician_id"`
	Status      string `json:"status"` // pending, completed
	AssignedTo  string `json:"assigned_to,omitempty"`
} 