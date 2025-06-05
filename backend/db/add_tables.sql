-- 创建tasks表
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER,
    physician_id INTEGER REFERENCES physicians(id),
    status TEXT DEFAULT 'pending',
    assigned_to TEXT,
    PRIMARY KEY (id, physician_id)
);

-- 创建human_annotations表
CREATE TABLE IF NOT EXISTS human_annotations (
    id SERIAL PRIMARY KEY,
    physician_id INTEGER REFERENCES physicians(id),
    evaluator TEXT,
    task_id INTEGER,
    trait TEXT,
    score INTEGER,
    consistency INTEGER,
    sufficiency INTEGER,
    evidence TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (physician_id, evaluator, task_id, trait)
);

-- 创建model_rankings表
CREATE TABLE IF NOT EXISTS model_rankings (
    id SERIAL PRIMARY KEY,
    physician_id INTEGER REFERENCES physicians(id),
    task_id INTEGER,
    evaluator TEXT,
    model_ranks TEXT,
    convinced BOOLEAN,
    error_model TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (physician_id, task_id, evaluator)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_physicians_npi ON physicians(npi);
CREATE INDEX IF NOT EXISTS idx_reviews_physician_id ON reviews(physician_id);
CREATE INDEX IF NOT EXISTS idx_model_annotations_physician_id ON model_annotations(physician_id);
CREATE INDEX IF NOT EXISTS idx_human_annotations_physician_id ON human_annotations(physician_id);
CREATE INDEX IF NOT EXISTS idx_tasks_physician_id ON tasks(physician_id);
CREATE INDEX IF NOT EXISTS idx_model_rankings_physician_id ON model_rankings(physician_id); 