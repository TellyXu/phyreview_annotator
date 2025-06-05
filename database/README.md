---

## database structure

### 1. `physicians` — 医生信息表

| 字段名           | 类型      | 描述                        |
|----------------|---------|---------------------------|
| `id`           | SERIAL  | 主键                         |
| `phy_id`       | BIGINT  | 医生原始数据唯一 ID             |
| `npi`          | BIGINT  | 国家提供者编号                 |
| `first_name`   | TEXT    | 医生名字                     |
| `last_name`    | TEXT    | 医生姓氏                     |
| `gender`       | TEXT    | 性别                        |
| `credential`   | TEXT    | 医生头衔（如 MD）              |
| `specialty`    | TEXT    | 医生专业领域                  |
| `practice_zip5`| TEXT    | 实践邮编                    |
| `business_zip5`| TEXT    | 商业邮编                    |
| `biography_doc`| TEXT    | 简介                        |
| `education_doc`| TEXT    | 教育经历                     |
| `num_reviews`  | INTEGER | 评论数量                     |
| `doc_name`     | TEXT    | 医生显示名称                  |
| `zip3`         | TEXT    | 邮编前 3 位                   |
| `zip2`         | TEXT    | 邮编前 2 位                   |
| `zipcode`      | TEXT    | 完整邮编                     |
| `state`        | TEXT    | 所在州                      |
| `region`       | TEXT    | 地区分布                     |

---

### 2. `reviews` — 评论信息表

| 字段名           | 类型       | 描述                  |
|----------------|----------|---------------------|
| `id`           | SERIAL   | 主键                  |
| `physician_id` | INTEGER  | 外键，关联 physicians |
| `review_index` | INTEGER  | 评论编号（#0, #1 ...） |
| `source`       | TEXT     | 来源（Vitals、HG等）    |
| `date`         | TIMESTAMP| 时间戳                |
| `text`         | TEXT     | 评论内容                |

---

### 3. `model_annotations` — 模型人格标注表

| 字段名           | 类型       | 描述                         |
|----------------|----------|----------------------------|
| `id`           | SERIAL   | 主键                         |
| `physician_id` | INTEGER  | 外键，关联 physicians         |
| `model_name`   | TEXT     | 模型名称，如 GPT-4, Gemini 等 |
| `trait`        | TEXT     | 人格维度，如 Openness        |
| `score`        | TEXT     | 打分结果（Low, Moderate, High）|
| `consistency`  | TEXT     | 模型一致性描述                 |
| `sufficiency`  | TEXT     | 模型证据充分性描述              |
| `evidence`     | TEXT     | 模型提供的原始证据文本           |

---

### 4. `model_evaluations` — 人类对模型输出的评价

| 字段名               | 类型       | 描述                          |
|--------------------|----------|-----------------------------|
| `id`               | SERIAL   | 主键                          |
| `model_annotation_id` | INTEGER  | 外键，关联 model_annotations   |
| `evaluator`        | TEXT     | 人类标注者 ID 或姓名（可匿名）      |
| `accuracy_score`   | TEXT     | 准确性评价（Good/Fair/Poor）    |
| `comment`          | TEXT     | 主观评价文字                    |
| `timestamp`        | TIMESTAMP| 时间戳（自动记录）              |

---

