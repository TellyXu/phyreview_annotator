// 医生信息类型
export interface Physician {
  id: number;
  phy_id: number;
  npi: number;
  first_name: string;
  last_name: string;
  gender: string;
  credential: string;
  specialty: string;
  practice_zip5: string;
  business_zip5: string;
  biography_doc: string;
  education_doc: string;
  num_reviews: number;
  doc_name: string;
  zip3: string;
  zip2: string;
  zipcode: string;
  state: string;
  region: string;
  reviews?: Review[];
}

// 评论类型
export interface Review {
  id: number;
  physician_id: number;
  review_index: number;
  source: string;
  date: string;
  text: string;
}

// 任务类型
export interface Task {
  id: number;
  physician_id: number;
  status: 'pending' | 'completed';
  assigned_to: string;
}

// 模型标注类型
export interface ModelAnnotation {
  id: number;
  physician_id: number;
  model_name: string;
  trait: TraitType;
  score: string;
  consistency: ConsistencyType;
  sufficiency: SufficiencyType;
  evidence: string;
}

// 人类标注类型
export interface HumanAnnotation {
  id?: number;
  physician_id: number;
  evaluator: string;
  task_id: number;
  trait: TraitType;
  score: number;
  consistency: number;
  sufficiency: number;
  evidence: string;
  timestamp?: string;
}

// 模型排名类型
export interface ModelRanking {
  id?: number;
  physician_id: number;
  task_id: number;
  evaluator: string;
  model_ranks: string; // JSON格式的模型排名
  convinced: boolean;
  error_model: string;
  timestamp?: string;
}

// 特质类型
export type TraitType = 'Openness' | 'Conscientiousness' | 'Extraversion' | 'Agreeableness' | 'Neuroticism';

// 一致性类型
export type ConsistencyType = 'Low' | 'Moderate' | 'High';

// 充分性类型
export type SufficiencyType = 'Low' | 'Moderate' | 'High';

// 分数类型
export type ScoreType = 'No Evidence' | 'Low' | 'Low to Moderate' | 'Moderate' | 'Moderate to High' | 'High';

// 标注指南
export const ANNOTATION_GUIDELINE = `
You are an expert psychologist.

Based on the provided patient reviews, analyze the Big Five personality traits for the focused physician:
- Openness
- Conscientiousness
- Extraversion
- Agreeableness
- Neuroticism

Output Instructions:
- Keep in mind that the reviews are about a physician, not a patient. 
- If the reviews contain no evidence for a trait, output "No Evidence" for the score.
- When finding evidence for a trait, make sure the evidence is related to the physician, not others.
- Output strictly in XML format.
- For each trait, you must generate:
    - name tag: Must be one of [Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism].
    - score tag: Must be selected from [No Evidence, Low, Low to Moderate, Moderate, Moderate to High, High]. If no evidence is found, output "No Evidence". If any evidence is found, output the score that best describes the evidence.
    - evidence tag: Write 2-3 sentences that combine reasoning with direct quotes or paraphrased examples from the reviews.
    - consistency tag: Must be selected from [Low, Moderate, High]. High consistency means the trait is consistently mentioned across multiple reviews.
    - sufficiency tag: Must be selected from [Low, Moderate, High]. High sufficiency means the trait is supported by the sufficient evidence from the reviews.
`;

// 大五人格特质描述
export const TRAIT_DESCRIPTIONS = {
  Openness: 'Openness refers to the individual\'s receptiveness to new experiences, ideas, and perspectives. People high in openness typically have curiosity, creativity, and imagination, and enjoy trying new things.',
  Conscientiousness: 'Conscientiousness refers to the individual\'s self-discipline, sense of responsibility, and organizational skills. People high in conscientiousness are typically careful, reliable, organized, and follow rules and plans strictly.',
  Extraversion: 'Extraversion refers to the individual\'s level of activity in social interactions and tendency to seek stimulation. People high in extraversion are typically energetic, talkative, confident, and enjoy interacting with others.',
  Agreeableness: 'Agreeableness refers to the individual\'s friendliness and level of cooperation when interacting with others. People high in agreeableness typically trust others, are compassionate, understanding, and willing to help others.',
  Neuroticism: 'Neuroticism refers to the individual\'s tendency to experience negative emotions and emotional stability. People high in neuroticism may be more prone to anxiety, irritability, depression, and have poorer ability to cope with stress.'
}; 