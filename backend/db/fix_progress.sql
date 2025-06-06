-- 修复trait_progress表数据一致性问题

-- 首先确保表存在
CREATE TABLE IF NOT EXISTS trait_progress (
    id SERIAL PRIMARY KEY,
    physician_id INTEGER REFERENCES physicians(id),
    task_id INTEGER,
    evaluator TEXT,
    trait TEXT,
    human_annotation_completed BOOLEAN DEFAULT FALSE,
    machine_evaluation_completed BOOLEAN DEFAULT FALSE,
    review_completed BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(physician_id, task_id, evaluator, trait)
);

-- 创建索引提高查询性能
CREATE INDEX IF NOT EXISTS idx_trait_progress_physician_id ON trait_progress(physician_id);
CREATE INDEX IF NOT EXISTS idx_trait_progress_task_id ON trait_progress(task_id);
CREATE INDEX IF NOT EXISTS idx_trait_progress_evaluator ON trait_progress(evaluator);
CREATE INDEX IF NOT EXISTS idx_trait_progress_trait ON trait_progress(trait);

-- 清理不一致的数据并修复
-- 查找有人类标注但没有进度记录的情况
INSERT INTO trait_progress 
    (physician_id, task_id, evaluator, trait, human_annotation_completed, machine_evaluation_completed, review_completed, timestamp)
SELECT DISTINCT
    h.physician_id, h.task_id, h.evaluator, h.trait, TRUE, FALSE, FALSE, NOW()
FROM 
    human_annotations h
LEFT JOIN 
    trait_progress p 
ON 
    h.physician_id = p.physician_id AND h.task_id = p.task_id AND h.evaluator = p.evaluator AND h.trait = p.trait
WHERE 
    p.id IS NULL;

-- 查找有机器评价但没有进度记录的情况
INSERT INTO trait_progress 
    (physician_id, task_id, evaluator, trait, human_annotation_completed, machine_evaluation_completed, review_completed, timestamp)
SELECT DISTINCT
    m.physician_id, m.task_id, m.evaluator, m.trait, FALSE, TRUE, FALSE, NOW()
FROM 
    machine_annotation_evaluation m
LEFT JOIN 
    trait_progress p 
ON 
    m.physician_id = p.physician_id AND m.task_id = p.task_id AND m.evaluator = p.evaluator AND m.trait = p.trait
WHERE 
    p.id IS NULL;

-- 修正进度不一致的情况
UPDATE trait_progress p
SET human_annotation_completed = TRUE
FROM human_annotations h
WHERE 
    p.physician_id = h.physician_id AND 
    p.task_id = h.task_id AND 
    p.evaluator = h.evaluator AND 
    p.trait = h.trait AND
    p.human_annotation_completed = FALSE;

UPDATE trait_progress p
SET machine_evaluation_completed = TRUE
FROM machine_annotation_evaluation m
WHERE 
    p.physician_id = m.physician_id AND 
    p.task_id = m.task_id AND 
    p.evaluator = m.evaluator AND 
    p.trait = m.trait AND
    p.machine_evaluation_completed = FALSE;

-- 输出修复后的统计信息
SELECT 'Total progress records' as label, COUNT(*) as count FROM trait_progress
UNION ALL
SELECT 'Human annotation completed', COUNT(*) FROM trait_progress WHERE human_annotation_completed = TRUE
UNION ALL
SELECT 'Machine evaluation completed', COUNT(*) FROM trait_progress WHERE machine_evaluation_completed = TRUE
UNION ALL
SELECT 'Review completed', COUNT(*) FROM trait_progress WHERE review_completed = TRUE; 