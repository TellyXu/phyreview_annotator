package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
	"github.com/phyreview_annotator/db"
)

// JSON数据结构
type PhysicianRecord struct {
	PhyID        int64   `json:"PhyID"`
	NPI          int64   `json:"NPI"`
	FirstName    string  `json:"FirstName"`
	LastName     string  `json:"LastName"`
	Gender       string  `json:"Gender"`
	Credential   string  `json:"Credential"`
	Specialty    string  `json:"Specialty"`
	PracticeZip5 float64 `json:"PracticeZip5"`
	BusinessZip5 float64 `json:"BusinessZip5"`
	BiographyDoc string  `json:"biography_doc"`
	EducationDoc string  `json:"education_doc"`
	NumReviews   float64 `json:"num_reviews"`
	ReviewDoc    string  `json:"review_doc"`
	DocName      string  `json:"DocName"`
	Zipcode      string  `json:"zipcode"`
	State        string  `json:"state"`
	Region       string  `json:"Region"`

	// AI模型输出
	OutputGPT4_1    ModelOutputs `json:"output_openai_gpt-4.1"`
	OutputGPT4O     ModelOutputs `json:"output_openai_gpt-4o"`
	OutputGemini25F ModelOutputs `json:"output_gemini_gemini-2.5-flash-preview-05-20"`
	OutputGemini20F ModelOutputs `json:"output_gemini_gemini-2.0-flash"`
	OutputGemini25P ModelOutputs `json:"output_gemini_gemini-2.5-pro-preview-05-06"`
	OutputClaude37  ModelOutputs `json:"output_anthropic_claude-3-7-sonnet-20250219"`
}

type ModelOutputs struct {
	Openness          TraitAssessment `json:"Openness"`
	Conscientiousness TraitAssessment `json:"Conscientiousness"`
	Extraversion      TraitAssessment `json:"Extraversion"`
	Agreeableness     TraitAssessment `json:"Agreeableness"`
	Neuroticism       TraitAssessment `json:"Neuroticism"`
}

type TraitAssessment struct {
	Consistency string `json:"consistency"`
	Evidence    string `json:"evidence"`
	Score       string `json:"score"`
	Sufficiency string `json:"sufficiency"`
}

// 解析评论的正则表达式 - 使用测试过的工作模式
var reviewRegex = regexp.MustCompile(`(?s)<review><meta>#(\d+).*?</meta>(.*?)</review>`)

func main() {
	// 加载环境变量
	err := godotenv.Load("../../.env")
	if err != nil {
		log.Println("Warning: .env file not found, using environment variables")
	}

	// 初始化数据库连接
	db.InitDB()
	defer db.CloseDB()

	// 读取JSON文件
	jsonData, err := ioutil.ReadFile("../../../database/first_10_phy_records.json")
	if err != nil {
		log.Fatal("Failed to read JSON file:", err)
	}

	// 解析JSON
	var records []PhysicianRecord
	err = json.Unmarshal(jsonData, &records)
	if err != nil {
		log.Fatal("Failed to parse JSON:", err)
	}

	log.Printf("Found %d physician records to import", len(records))

	// 导入每个医生的数据
	for i, record := range records {
		log.Printf("Importing physician %d/%d: %s", i+1, len(records), record.DocName)

		// 导入医生信息
		physicianID := importPhysician(record)

		// 导入评论
		importReviews(physicianID, record.ReviewDoc)

		// 导入AI模型标注
		importModelAnnotations(physicianID, record)
	}

	log.Println("Import completed successfully!")
}

func importPhysician(record PhysicianRecord) int {
	// 从zipcode中提取zip3和zip2
	zip3 := ""
	zip2 := ""
	if len(record.Zipcode) >= 3 {
		zip3 = record.Zipcode[:3]
	}
	if len(record.Zipcode) >= 2 {
		zip2 = record.Zipcode[:2]
	}

	query := `
		INSERT INTO physicians (phy_id, npi, first_name, last_name, gender, credential, specialty, 
								practice_zip5, business_zip5, biography_doc, education_doc, num_reviews,
								doc_name, zip3, zip2, zipcode, state, region) 
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) 
		RETURNING id`

	var physicianID int
	err := db.DB.QueryRow(
		query,
		record.PhyID,
		record.NPI,
		record.FirstName,
		record.LastName,
		record.Gender,
		record.Credential,
		record.Specialty,
		fmt.Sprintf("%.0f", record.PracticeZip5),
		fmt.Sprintf("%.0f", record.BusinessZip5),
		record.BiographyDoc,
		record.EducationDoc,
		int(record.NumReviews),
		record.DocName,
		zip3,
		zip2,
		record.Zipcode,
		record.State,
		record.Region,
	).Scan(&physicianID)

	if err != nil {
		log.Printf("Warning: Failed to import physician %s: %v", record.DocName, err)
		return 0
	}

	log.Printf("Imported physician with ID: %d", physicianID)
	return physicianID
}

func importReviews(physicianID int, reviewDoc string) {
	if physicianID == 0 {
		return
	}

	// 使用正则表达式解析评论
	matches := reviewRegex.FindAllStringSubmatch(reviewDoc, -1)

	log.Printf("Found %d reviews to import", len(matches))

	for _, match := range matches {
		if len(match) != 3 {
			continue
		}

		reviewNum := match[1]
		content := strings.TrimSpace(match[2])

		// 插入评论 - 使用简化的字段
		query := `
			INSERT INTO reviews (physician_id, review_index, source, date, text) 
			VALUES ($1, $2, $3, $4, $5)`

		reviewNumInt, _ := strconv.Atoi(reviewNum)
		// 使用默认值，因为从简化匹配中无法提取日期和来源
		_, err := db.DB.Exec(query, physicianID, reviewNumInt, "Unknown", time.Now(), content)
		if err != nil {
			log.Printf("Warning: Failed to import review %s: %v", reviewNum, err)
		}
	}
}

func importModelAnnotations(physicianID int, record PhysicianRecord) {
	if physicianID == 0 {
		return
	}

	// 模型名称和输出的映射
	modelData := map[string]ModelOutputs{
		"GPT-4":                    record.OutputGPT4_1,
		"GPT-4o":                   record.OutputGPT4O,
		"Gemini-2.5-Flash-Preview": record.OutputGemini25F,
		"Gemini-2.0-Flash":         record.OutputGemini20F,
		"Gemini-2.5-Pro-Preview":   record.OutputGemini25P,
		"Claude-3.7-Sonnet":        record.OutputClaude37,
	}

	for modelName, outputs := range modelData {
		// 特质数据映射
		traits := map[string]TraitAssessment{
			"openness":          outputs.Openness,
			"conscientiousness": outputs.Conscientiousness,
			"extraversion":      outputs.Extraversion,
			"agreeableness":     outputs.Agreeableness,
			"neuroticism":       outputs.Neuroticism,
		}

		for trait, assessment := range traits {
			query := `
				INSERT INTO model_annotations (physician_id, model_name, trait, score, 
											  consistency, sufficiency, evidence) 
				VALUES ($1, $2, $3, $4, $5, $6, $7)`

			_, err := db.DB.Exec(
				query,
				physicianID,
				modelName,
				trait,
				assessment.Score,
				assessment.Consistency,
				assessment.Sufficiency,
				assessment.Evidence,
			)

			if err != nil {
				log.Printf("Warning: Failed to import model annotation for %s/%s: %v", modelName, trait, err)
			}
		}
	}

	log.Printf("Imported model annotations for physician %d", physicianID)
}
