-- 清空数据库脚本 - 只保留表结构，删除所有数据
-- 删除数据的顺序很重要，要先删除有外键依赖的表

-- 清空所有数据表
TRUNCATE TABLE machine_annotation_evaluation CASCADE;
TRUNCATE TABLE trait_progress CASCADE;
TRUNCATE TABLE human_annotations CASCADE;
TRUNCATE TABLE model_annotations CASCADE;
TRUNCATE TABLE reviews CASCADE;
TRUNCATE TABLE tasks CASCADE;
TRUNCATE TABLE physicians CASCADE;

-- 重置序列（自增ID）
ALTER SEQUENCE physicians_id_seq RESTART WITH 1;
ALTER SEQUENCE reviews_id_seq RESTART WITH 1;
ALTER SEQUENCE model_annotations_id_seq RESTART WITH 1;
ALTER SEQUENCE human_annotations_id_seq RESTART WITH 1;
ALTER SEQUENCE trait_progress_id_seq RESTART WITH 1;
ALTER SEQUENCE machine_annotation_evaluation_id_seq RESTART WITH 1; 