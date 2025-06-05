import psycopg2
import json
import re
from datetime import datetime

# --- 数据库配置 ---
conn = psycopg2.connect(
    dbname="physicians",
    user="tianli",
    password="hEWH7PbFSEwphFXLMoWpt3I0c1PyXEBb",
    host="dpg-d0voqjumcj7s73fr5ong-a.virginia-postgres.render.com",
    port="5432"
)
cur = conn.cursor()

# --- 建表 SQL ---
cur.execute("""
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
            """)

cur.execute("""
            CREATE TABLE IF NOT EXISTS reviews (
                                                   id SERIAL PRIMARY KEY,
                                                   physician_id INTEGER REFERENCES physicians(id),
                review_index INTEGER,
                source TEXT,
                date TIMESTAMP,
                text TEXT
                );
            """)

cur.execute("""
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
            """)

cur.execute("""
            CREATE TABLE IF NOT EXISTS model_evaluations (
                                                             id SERIAL PRIMARY KEY,
                                                             model_annotation_id INTEGER REFERENCES model_annotations(id),
                evaluator TEXT,
                accuracy_score TEXT,
                comment TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
conn.commit()

# --- 加载 JSON 数据 ---
from sample import data as doc

# --- 插入 physicians 数据 ---
cur.execute("""
            INSERT INTO physicians (
                phy_id, npi, first_name, last_name, gender, credential, specialty,
                practice_zip5, business_zip5, biography_doc, education_doc, num_reviews,
                doc_name, zip3, zip2, zipcode, state, region
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                doc["PhyID"], doc["NPI"], doc["FirstName"], doc["LastName"], doc["Gender"],
                doc["Credential"], doc["Specialty"], str(doc["PracticeZip5"]), str(doc["BusinessZip5"]),
                doc["biography_doc"], doc["education_doc"], int(doc["num_reviews"]),
                doc["DocName"], doc["Zip3"], doc["Zip2"], doc["zipcode"], doc["state"], doc["Region"]
            ))
physician_id = cur.fetchone()[0]

# --- 解析并插入 reviews ---
pattern = re.compile(r"<review><meta>#(\d+) - (.*?) - (.*?)</meta>(.*?)</review>", re.DOTALL)
for match in pattern.finditer(doc["review_doc"]):
    idx, date_str, source, text = match.groups()
    try:
        dt = datetime.strptime(date_str.strip(), "%Y-%m-%d %H:%M:%S")
    except:
        try:
            dt = datetime.strptime(date_str.strip(), "%Y-%m-%d")
        except:
            dt = None
    cur.execute("""
                INSERT INTO reviews (physician_id, review_index, source, date, text)
                VALUES (%s, %s, %s, %s, %s)
                """, (physician_id, int(idx), source.strip(), dt, text.strip()))

# --- 插入模型标注 ---
def insert_model_outputs(output_obj, model_name):
    for trait, detail in output_obj.items():
        cur.execute("""
                    INSERT INTO model_annotations (physician_id, model_name, trait, score, consistency, sufficiency, evidence)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """, (
                        physician_id, model_name, trait, detail["score"],
                        detail["consistency"], detail["sufficiency"], detail["evidence"]
                    ))

for key in doc:
    if key.startswith("output_"):
        insert_model_outputs(doc[key], key)

conn.commit()
cur.close()
conn.close()
print("✅ Upload completed.")