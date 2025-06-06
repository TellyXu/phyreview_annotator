package models

import (
	"time"
)

// Physician 医生信息表
type Physician struct {
	ID           int      `json:"id"`
	PhyID        int64    `json:"phy_id"`
	NPI          int64    `json:"npi"`
	FirstName    string   `json:"first_name"`
	LastName     string   `json:"last_name"`
	Gender       string   `json:"gender"`
	Credential   string   `json:"credential"`
	Specialty    string   `json:"specialty"`
	PracticeZip5 string   `json:"practice_zip5"`
	BusinessZip5 string   `json:"business_zip5"`
	BiographyDoc string   `json:"biography_doc"`
	EducationDoc string   `json:"education_doc"`
	NumReviews   int      `json:"num_reviews"`
	DocName      string   `json:"doc_name"`
	Zip3         string   `json:"zip3"`
	Zip2         string   `json:"zip2"`
	Zipcode      string   `json:"zipcode"`
	State        string   `json:"state"`
	Region       string   `json:"region"`
	Reviews      []Review `json:"reviews,omitempty" gorm:"foreignKey:PhysicianID"`
}

// Review 评论信息表
type Review struct {
	ID          int       `json:"id"`
	PhysicianID int       `json:"physician_id"`
	ReviewIndex int       `json:"review_index"`
	Source      string    `json:"source"`
	Date        time.Time `json:"date"`
	Text        string    `json:"text"`
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

// MachineAnnotationEvaluation 存储对机器标注的简单评价
type MachineAnnotationEvaluation struct {
	ID                int       `json:"id"`
	ModelAnnotationID int       `json:"model_annotation_id"`
	PhysicianID       int       `json:"physician_id"`
	TaskID            int       `json:"task_id"`
	Evaluator         string    `json:"evaluator"`
	Trait             string    `json:"trait"`
	ModelName         string    `json:"model_name"`
	Rating            string    `json:"rating"` // thumb_up, thumb_down, just_soso
	Comment           string    `json:"comment"`
	Timestamp         time.Time `json:"timestamp"`
}

// TraitProgress 追踪用户在每个trait上的进度
type TraitProgress struct {
	ID                         int       `json:"id"`
	PhysicianID                int       `json:"physician_id"`
	TaskID                     int       `json:"task_id"`
	Evaluator                  string    `json:"evaluator"`
	Trait                      string    `json:"trait"` // openness, conscientiousness, extraversion, agreeableness, neuroticism
	HumanAnnotationCompleted   bool      `json:"human_annotation_completed"`
	MachineEvaluationCompleted bool      `json:"machine_evaluation_completed"`
	ReviewCompleted            bool      `json:"review_completed"`
	Timestamp                  time.Time `json:"timestamp"`
}

// Task 任务信息
type Task struct {
	ID          int       `json:"id"`
	PhysicianID int       `json:"physician_id"`
	Status      string    `json:"status"` // pending, in_progress, completed
	AssignedTo  string    `json:"assigned_to,omitempty"`
	Timestamp   time.Time `json:"timestamp"`
}

// TraitWorkflowStage 工作流阶段枚举
const (
	StageHumanAnnotation   = "human_annotation"
	StageMachineEvaluation = "machine_evaluation"
	StageReviewAndModify   = "review_and_modify"
	StageCompleted         = "completed"
)

// Rating 评价枚举
const (
	RatingThumbUp   = "thumb_up"
	RatingThumbDown = "thumb_down"
	RatingJustSoso  = "just_soso"
)

// Personality traits 人格特质常量
const (
	TraitOpenness          = "openness"
	TraitConscientiousness = "conscientiousness"
	TraitExtraversion      = "extraversion"
	TraitAgreeableness     = "agreeableness"
	TraitNeuroticism       = "neuroticism"
)
