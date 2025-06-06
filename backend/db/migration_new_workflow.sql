-- 新工作流数据库迁移
-- 删除不再需要的表
DROP TABLE IF EXISTS model_rankings;
DROP TABLE IF EXISTS model_evaluations;

-- 修改tasks表，添加timestamp字段
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 创建trait_progress表：追踪用户在每个trait上的进度
CREATE TABLE IF NOT EXISTS trait_progress (
    id SERIAL PRIMARY KEY,
    physician_id INTEGER REFERENCES physicians(id),
    task_id INTEGER,
    evaluator TEXT,
    trait TEXT, -- openness, conscientiousness, extraversion, agreeableness, neuroticism
    human_annotation_completed BOOLEAN DEFAULT FALSE,
    machine_evaluation_completed BOOLEAN DEFAULT FALSE,
    review_completed BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (physician_id, task_id, evaluator, trait)
);

-- 创建machine_annotation_evaluation表：存储对机器标注的简单评价
CREATE TABLE IF NOT EXISTS machine_annotation_evaluation (
    id SERIAL PRIMARY KEY,
    model_annotation_id INTEGER REFERENCES model_annotations(id),
    physician_id INTEGER REFERENCES physicians(id),
    task_id INTEGER,
    evaluator TEXT,
    trait TEXT,
    model_name TEXT,
    rating TEXT CHECK (rating IN ('thumb_up', 'thumb_down', 'just_soso')),
    comment TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (model_annotation_id, evaluator, task_id)
);

-- 创建索引以提高查询性能
CREATE INDEX idx_trait_progress_physician_task ON trait_progress(physician_id, task_id);
CREATE INDEX idx_trait_progress_evaluator_trait ON trait_progress(evaluator, trait);
CREATE INDEX idx_machine_evaluation_physician_task ON machine_annotation_evaluation(physician_id, task_id);
CREATE INDEX idx_machine_evaluation_evaluator_trait ON machine_annotation_evaluation(evaluator, trait);

-- 初始化示例数据：为现有的physician创建trait_progress记录
INSERT INTO trait_progress (physician_id, task_id, evaluator, trait) 
SELECT 
    2, -- physician_id for NPI 1043259971
    1, -- task_id 
    'test_user', -- evaluator
    trait.name
FROM (
    VALUES 
        ('openness'),
        ('conscientiousness'), 
        ('extraversion'),
        ('agreeableness'),
        ('neuroticism')
) AS trait(name)
ON CONFLICT (physician_id, task_id, evaluator, trait) DO NOTHING;

-- 确保model_annotations表有正确的physician_id (应该是2，不是1)
UPDATE model_annotations SET physician_id = 2 WHERE physician_id = 1; 