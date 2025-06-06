-- 完全重建数据库脚本
-- 删除所有现有表（顺序很重要，避免外键约束错误）
DROP TABLE IF EXISTS machine_annotation_evaluation CASCADE;
DROP TABLE IF EXISTS trait_progress CASCADE;
DROP TABLE IF EXISTS model_rankings CASCADE;
DROP TABLE IF EXISTS model_evaluations CASCADE;
DROP TABLE IF EXISTS human_annotations CASCADE;
DROP TABLE IF EXISTS model_annotations CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS physicians CASCADE;

-- 创建physicians表
CREATE TABLE physicians (
    id SERIAL PRIMARY KEY,
    phy_id BIGINT,
    npi BIGINT UNIQUE,
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
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    physician_id INTEGER REFERENCES physicians(id),
    review_index INTEGER,
    source TEXT,
    date TIMESTAMP,
    text TEXT
);

-- 创建model_annotations表
CREATE TABLE model_annotations (
    id SERIAL PRIMARY KEY,
    physician_id INTEGER REFERENCES physicians(id),
    model_name TEXT,
    trait TEXT,
    score TEXT,
    consistency TEXT,
    sufficiency TEXT,
    evidence TEXT
);

-- 创建tasks表
CREATE TABLE tasks (
    id INTEGER,
    physician_id INTEGER REFERENCES physicians(id),
    status TEXT DEFAULT 'pending',
    assigned_to TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, physician_id)
);

-- 创建human_annotations表
CREATE TABLE human_annotations (
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

-- 创建trait_progress表：追踪用户在每个trait上的进度
CREATE TABLE trait_progress (
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
CREATE TABLE machine_annotation_evaluation (
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
CREATE INDEX idx_physicians_npi ON physicians(npi);
CREATE INDEX idx_reviews_physician_id ON reviews(physician_id);
CREATE INDEX idx_model_annotations_physician_id ON model_annotations(physician_id);
CREATE INDEX idx_human_annotations_physician_id ON human_annotations(physician_id);
CREATE INDEX idx_tasks_physician_id ON tasks(physician_id);
CREATE INDEX idx_trait_progress_physician_task ON trait_progress(physician_id, task_id);
CREATE INDEX idx_trait_progress_evaluator_trait ON trait_progress(evaluator, trait);
CREATE INDEX idx_machine_evaluation_physician_task ON machine_annotation_evaluation(physician_id, task_id);
CREATE INDEX idx_machine_evaluation_evaluator_trait ON machine_annotation_evaluation(evaluator, trait);

-- 插入测试医生数据
INSERT INTO physicians (phy_id, npi, first_name, last_name, gender, credential, specialty, practice_zip5, business_zip5, biography_doc, education_doc, num_reviews, doc_name, zip3, zip2, zipcode, state, region)
VALUES (100047789, 1043259971, 'NIRMALA', 'ABRAHAM', 'F', 'MD', 'Anesthesiology Physician', '45342.0', '45342.0', 'Dr. Nirmala Abraham, MD is a Pain Medicine Specialist...', '<education>Loma Linda University School Of Medicine...</education>', 14, 'Dr. Nirmala Abraham', '453', '45', '45342', 'OH', 'East North Central');

-- 插入测试评论数据
INSERT INTO reviews (physician_id, review_index, source, date, text)
VALUES 
(1, 0, 'Vitals', '2009-10-06 14:11:45', '<meta>#0 - 2009-10-06 14:11:45 - Vitals</meta>This is one of the most unprofessional and rudest doctors I have ever come across. I had recently had open heart surgery then an auto accident when returning to work, Caused me to break a rib and muscle tear from the seat belt and damage to my lower back L1-L5. I have lost most feeling in my legs and terrible pain in back and chest. After several visits and no relief on my own I doubled up the pain meds. She had a fit. Again perscribed the same med that did not work in addition to 2 others. One of them the druggist interferred with my current heart meds and it was suggested to call my surgeon before filling script. The surgeon told me not to fill it and asked why it was prescribed. I told him and he suggested another dose of the pain med increasing by one pill. When I told this to Dr. Sathi-Welsh she dropped me as a patient and told me to have the surgeon take over the pain management. I would NEVER recommend this doctor to anyone and have informed my insurance company and the state.'),
(1, 1, 'Vitals', '2010-04-02 18:53:44', '<meta>#1 - 2010-04-02 18:53:44 - Vitals</meta>doesn''t manage your pain, inconsistent/contradictory paperwork, appears sedated all the time, unprofessional staff including her, do not see this women'),
(1, 2, 'Unknown', '2010-06-30 00:00:00', 'assembly line medicine knew of drug use but scheduled an appointment and had me wait to see her to tell me that I was not welcome at her office'),
(1, 3, 'Unknown', '2010-12-20 00:00:00', 'ive been in 3 car accidents, have 2 herniations in my neck causing severe migraine and more, 2 herniations l4 & l5, the pain as u know is terrible, along with TMJ! I went to her, after having to fill out a booklet to see if she would accept ME as a patient, then they had the nerve to unrine test me which came up neg. She was one of the coldest people I ever met. Im a nurse, been around. All I want is some kind of relief, i just got a bill from Lab. Can u believe, they sent my urine out to be tested again without my consent and its out of network so i got stuck with the bill!'),
(1, 4, 'Unknown', '2011-01-15 00:00:00', 'Had appointment scheduled, drove an hour to get there, was told she was too busy to see me. Rescheduled for the following week, same thing happened again. Third time I was seen but she spent less than 5 minutes with me and seemed completely uninterested in helping with my pain management.'),
(1, 5, 'Unknown', '2011-03-22 00:00:00', 'Very unprofessional behavior. Refused to provide adequate pain management after reviewing my medical records. Made me feel like I was drug seeking when I have legitimate medical conditions requiring pain relief.'),
(1, 6, 'Unknown', '2011-05-10 00:00:00', 'Staff was rude and dismissive. Doctor seemed distracted during the entire appointment. Did not feel heard or understood. Would not recommend to anyone seeking compassionate care.'),
(1, 7, 'Unknown', '2011-08-14 00:00:00', 'Waited over 2 hours past my appointment time. When finally seen, the doctor was rushing through everything and did not take time to understand my concerns. Very disappointing experience.'),
(1, 8, 'Unknown', '2011-11-30 00:00:00', 'The doctor was knowledgeable but lacked empathy. Treatment approach was very rigid and did not consider my individual circumstances. Communication could be much better.'),
(1, 9, 'Unknown', '2012-02-18 00:00:00', 'Inconsistent treatment recommendations. What was discussed in one visit was contradicted in the next. Makes it very difficult to follow a coherent treatment plan.'),
(1, 10, 'Unknown', '2012-04-25 00:00:00', 'Office environment feels very clinical and unwelcoming. Staff seems overworked and stressed. This affects the overall patient experience negatively.'),
(1, 11, 'Unknown', '2012-07-12 00:00:00', 'Doctor seems to have made up her mind about treatment before fully listening to patient concerns. Not very collaborative in approach to care.'),
(1, 12, 'Unknown', '2012-09-08 00:00:00', 'Billing issues and administrative problems made the experience very frustrating. Multiple calls to resolve insurance matters that should have been handled properly initially.'),
(1, 13, 'Unknown', '2012-11-15 00:00:00', 'While the medical facility is well-equipped, the human element of care is lacking. More focus on efficiency than on patient comfort and satisfaction.');

-- 插入测试模型标注数据
INSERT INTO model_annotations (physician_id, model_name, trait, score, consistency, sufficiency, evidence)
VALUES 
-- GPT-4 标注
(1, 'GPT-4', 'openness', 'Low', 'Moderate', 'High', 'The physician shows little openness to patient suggestions or alternative approaches. Multiple reviews mention rigid treatment methods and unwillingness to consider patient input about medication effectiveness.'),
(1, 'GPT-4', 'conscientiousness', 'Moderate', 'High', 'High', 'The doctor demonstrates some level of conscientiousness in maintaining records and following protocols, but patients report inconsistent treatment recommendations between visits.'),
(1, 'GPT-4', 'extraversion', 'Low', 'High', 'High', 'Reviews consistently describe the doctor as "cold," "distant," and "rushing through appointments," indicating low extraversion and limited social engagement with patients.'),
(1, 'GPT-4', 'agreeableness', 'Low', 'High', 'High', 'Multiple reviews consistently describe the doctor as "rude," "unprofessional," and "dismissive," with patients feeling unheard and uncomfortable during interactions.'),
(1, 'GPT-4', 'neuroticism', 'Moderate to High', 'Moderate', 'Moderate', 'Some reviews suggest the doctor can be emotionally reactive when challenged or when patients question treatment decisions, though evidence is somewhat mixed.'),

-- Claude 标注
(1, 'Claude', 'openness', 'Low to Moderate', 'Moderate', 'Moderate', 'The physician appears somewhat resistant to patient input and alternative perspectives, with several mentions of rigid treatment approaches.'),
(1, 'Claude', 'conscientiousness', 'Moderate', 'Moderate', 'Moderate', 'The doctor shows mixed evidence of conscientiousness - maintains medical protocols but patients report inconsistent care between visits.'),
(1, 'Claude', 'extraversion', 'Low', 'High', 'High', 'Strong evidence of low extraversion with multiple patients describing the doctor as withdrawn, cold, and rushing through appointments without meaningful interaction.'),
(1, 'Claude', 'agreeableness', 'Low', 'High', 'High', 'Overwhelming evidence of low agreeableness with consistent patient reports of rude, dismissive, and unprofessional behavior across multiple reviews.'),
(1, 'Claude', 'neuroticism', 'Moderate', 'Low', 'Moderate', 'Some indication of emotional reactivity and stress-related responses, but evidence is limited and inconsistent across reviews.');

-- 插入测试任务数据
INSERT INTO tasks (id, physician_id, status, assigned_to)
VALUES (1, 1, 'in_progress', 'test_user');

-- 初始化trait_progress记录
INSERT INTO trait_progress (physician_id, task_id, evaluator, trait) 
VALUES 
(1, 1, 'test_user', 'openness'),
(1, 1, 'test_user', 'conscientiousness'),
(1, 1, 'test_user', 'extraversion'),
(1, 1, 'test_user', 'agreeableness'),
(1, 1, 'test_user', 'neuroticism'); 