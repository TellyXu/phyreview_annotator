-- 创建数据库
CREATE DATABASE phyreview;

-- 连接到数据库
\c phyreview;

-- 创建physicians表
CREATE TABLE IF NOT EXISTS physicians (
    id SERIAL PRIMARY KEY,
    phy_id BIGINT,
    npi BIGINT,
    first_name TEXT,
    last_name TEXT,
    gender TEXT,
    credential TEXT,
    specialty TEXT,
    practice_zip5 TEXT,
    business_zip5 TEXT,
    biography_doc TEXT,
    education_doc TEXT,
    num_reviews INTEGER,
    doc_name TEXT,
    zip3 TEXT,
    zip2 TEXT,
    zipcode TEXT,
    state TEXT,
    region TEXT
);

-- 创建reviews表
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    physician_id INTEGER REFERENCES physicians(id),
    review_index INTEGER,
    source TEXT,
    date TIMESTAMP,
    text TEXT
);

-- 创建model_annotations表
CREATE TABLE IF NOT EXISTS model_annotations (
    id SERIAL PRIMARY KEY,
    physician_id INTEGER REFERENCES physicians(id),
    model_name TEXT,
    trait TEXT,
    score TEXT,
    consistency TEXT,
    sufficiency TEXT,
    evidence TEXT
);

-- 创建model_evaluations表
CREATE TABLE IF NOT EXISTS model_evaluations (
    id SERIAL PRIMARY KEY,
    model_annotation_id INTEGER REFERENCES model_annotations(id),
    evaluator TEXT,
    accuracy_score TEXT,
    comment TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
CREATE INDEX idx_physicians_npi ON physicians(npi);
CREATE INDEX idx_reviews_physician_id ON reviews(physician_id);
CREATE INDEX idx_model_annotations_physician_id ON model_annotations(physician_id);
CREATE INDEX idx_human_annotations_physician_id ON human_annotations(physician_id);
CREATE INDEX idx_tasks_physician_id ON tasks(physician_id);
CREATE INDEX idx_model_rankings_physician_id ON model_rankings(physician_id);

-- 创建一些示例数据（可选）
INSERT INTO physicians (phy_id, npi, first_name, last_name, gender, credential, specialty, practice_zip5, business_zip5, biography_doc, education_doc, num_reviews, doc_name, zip3, zip2, zipcode, state, region)
VALUES (100047789, 1043259971, 'NIRMALA', 'ABRAHAM', 'F', 'MD', 'Anesthesiology Physician', '45342.0', '45342.0', 'Dr. Nirmala Abraham, MD is a Pain Medicine Specialist...', '<education>Loma Linda University School Of Medicine...</education>', 12, 'Dr. Nirmala Abraham', '453', '45', '45342', 'OH', 'East North Central');

-- 插入示例评论
INSERT INTO reviews (physician_id, review_index, source, date, text)
VALUES 
(1, 0, 'Vitals', '2009-10-06 14:11:45', '<meta>#0 - 2009-10-06 14:11:45 - Vitals</meta>This is one of the most unprofessional and rudest doctors I have ever come across...'),
(1, 1, 'Vitals', '2010-04-02 18:53:44', '<meta>#1 - 2010-04-02 18:53:44 - Vitals</meta>doesn''t manage your paininconsistent/contradictory paperworkappears sedated all the timeunprofessional staff including herdo not see this women');

-- 插入示例模型标注
INSERT INTO model_annotations (physician_id, model_name, trait, score, consistency, sufficiency, evidence)
VALUES 
(1, 'GPT-4', 'Openness', 'Low', 'Moderate', 'High', 'The physician shows little openness to patient suggestions or alternative approaches...'),
(1, 'GPT-4', 'Conscientiousness', 'Moderate', 'High', 'High', 'The doctor demonstrates some level of conscientiousness in maintaining records...'),
(1, 'GPT-4', 'Extraversion', 'No Evidence', 'Low', 'Low', 'The reviews contain no clear evidence regarding the physician''s extraversion...'),
(1, 'GPT-4', 'Agreeableness', 'Low', 'High', 'High', 'Multiple reviews consistently describe the doctor as "rude" and "unprofessional"...'),
(1, 'GPT-4', 'Neuroticism', 'Moderate to High', 'Moderate', 'Moderate', 'Some reviews suggest the doctor can be emotionally reactive when challenged...');

-- 添加另一个模型的示例标注
INSERT INTO model_annotations (physician_id, model_name, trait, score, consistency, sufficiency, evidence)
VALUES 
(1, 'Claude', 'Openness', 'Low to Moderate', 'Moderate', 'Moderate', 'The physician appears somewhat resistant to patient input and alternative perspectives...'),
(1, 'Claude', 'Conscientiousness', 'Moderate', 'Moderate', 'Moderate', 'The doctor shows mixed evidence of conscientiousness...'),
(1, 'Claude', 'Extraversion', 'No Evidence', 'Low', 'Low', 'There is insufficient information in the reviews to evaluate the doctor''s extraversion...'),
(1, 'Claude', 'Agreeableness', 'Low', 'High', 'High', 'Multiple patients describe negative interactions, with terms like "rudest" and "unprofessional"...'),
(1, 'Claude', 'Neuroticism', 'Moderate', 'Low', 'Moderate', 'Some reviews suggest emotional reactivity when contradicted...'); 