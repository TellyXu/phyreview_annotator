-- 插入示例医生数据
INSERT INTO physicians (phy_id, npi, first_name, last_name, gender, credential, specialty, practice_zip5, business_zip5, biography_doc, education_doc, num_reviews, doc_name, zip3, zip2, zipcode, state, region)
VALUES (100047789, 1043259971, 'NIRMALA', 'ABRAHAM', 'F', 'MD', 'Anesthesiology Physician', '45342', '45342', 'Dr. Nirmala Abraham, MD is a Pain Medicine Specialist...', '<education>Loma Linda University School Of Medicine...</education>', 12, 'Dr. Nirmala Abraham', '453', '45', '45342', 'OH', 'East North Central')
ON CONFLICT DO NOTHING;

-- 插入示例评论
INSERT INTO reviews (physician_id, review_index, source, date, text)
VALUES 
(1, 0, 'Vitals', '2009-10-06 14:11:45', '<meta>#0 - 2009-10-06 14:11:45 - Vitals</meta>This is one of the most unprofessional and rudest doctors I have ever come across...'),
(1, 1, 'Vitals', '2010-04-02 18:53:44', '<meta>#1 - 2010-04-02 18:53:44 - Vitals</meta>doesn''t manage your paininconsistent/contradictory paperworkappears sedated all the timeunprofessional staff including herdo not see this women')
ON CONFLICT DO NOTHING;

-- 插入示例模型标注
INSERT INTO model_annotations (physician_id, model_name, trait, score, consistency, sufficiency, evidence)
VALUES 
(1, 'GPT-4', 'Openness', 'Low', 'Moderate', 'High', 'The physician shows little openness to patient suggestions or alternative approaches...'),
(1, 'GPT-4', 'Conscientiousness', 'Moderate', 'High', 'High', 'The doctor demonstrates some level of conscientiousness in maintaining records...'),
(1, 'GPT-4', 'Extraversion', 'No Evidence', 'Low', 'Low', 'The reviews contain no clear evidence regarding the physician''s extraversion...'),
(1, 'GPT-4', 'Agreeableness', 'Low', 'High', 'High', 'Multiple reviews consistently describe the doctor as "rude" and "unprofessional"...'),
(1, 'GPT-4', 'Neuroticism', 'Moderate to High', 'Moderate', 'Moderate', 'Some reviews suggest the doctor can be emotionally reactive when challenged...')
ON CONFLICT DO NOTHING;

-- 添加另一个模型的示例标注
INSERT INTO model_annotations (physician_id, model_name, trait, score, consistency, sufficiency, evidence)
VALUES 
(1, 'Claude', 'Openness', 'Low to Moderate', 'Moderate', 'Moderate', 'The physician appears somewhat resistant to patient input and alternative perspectives...'),
(1, 'Claude', 'Conscientiousness', 'Moderate', 'Moderate', 'Moderate', 'The doctor shows mixed evidence of conscientiousness...'),
(1, 'Claude', 'Extraversion', 'No Evidence', 'Low', 'Low', 'There is insufficient information in the reviews to evaluate the doctor''s extraversion...'),
(1, 'Claude', 'Agreeableness', 'Low', 'High', 'High', 'Multiple patients describe negative interactions, with terms like "rudest" and "unprofessional"...'),
(1, 'Claude', 'Neuroticism', 'Moderate', 'Low', 'Moderate', 'Some reviews suggest emotional reactivity when contradicted...')
ON CONFLICT DO NOTHING; 