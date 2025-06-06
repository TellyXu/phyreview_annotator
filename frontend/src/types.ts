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
  status: 'pending' | 'in_progress' | 'completed';
  assigned_to: string;
  timestamp?: string;
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

// Trait进度追踪类型
export interface TraitProgress {
  id?: number;
  physician_id: number;
  task_id: number;
  evaluator: string;
  trait: TraitType;
  human_annotation_completed: boolean;
  machine_evaluation_completed: boolean;
  review_completed: boolean;
  timestamp?: string;
}

// 机器标注评价类型
export interface MachineAnnotationEvaluation {
  id?: number;
  model_annotation_id: number;
  physician_id: number;
  task_id: number;
  evaluator: string;
  trait: TraitType;
  model_name: string;
  rating: 'thumb_up' | 'thumb_down' | 'just_soso';
  comment: string;
  timestamp?: string;
}

// 特质类型 (修改为小写以匹配后端)
export type TraitType = 'openness' | 'conscientiousness' | 'extraversion' | 'agreeableness' | 'neuroticism';

// 特质显示名称映射
export const TRAIT_DISPLAY_NAMES: Record<TraitType, string> = {
  'openness': 'Openness',
  'conscientiousness': 'Conscientiousness', 
  'extraversion': 'Extraversion',
  'agreeableness': 'Agreeableness',
  'neuroticism': 'Neuroticism'
};

// 工作流阶段类型
export type WorkflowStage = 'human_annotation' | 'machine_evaluation' | 'review_and_modify' | 'completed';

// 评价类型
export type RatingType = 'thumb_up' | 'thumb_down' | 'just_soso';

// 评价显示名称映射
export const RATING_DISPLAY_NAMES: Record<RatingType, string> = {
  'thumb_up': '👍 Good',
  'thumb_down': '👎 Poor', 
  'just_soso': '😐 Okay'
};

// 一致性类型
export type ConsistencyType = 'Low' | 'Moderate' | 'High';

// 充分性类型
export type SufficiencyType = 'Low' | 'Moderate' | 'High';

// 分数类型
export type ScoreType = 'No Evidence' | 'Low' | 'Low to Moderate' | 'Moderate' | 'Moderate to High' | 'High';

// Trait工作流状态
export interface TraitWorkflowState {
  progress: TraitProgress;
  currentStage: WorkflowStage;
  humanAnnotation?: HumanAnnotation;
  machineAnnotations?: ModelAnnotation[];
  machineEvaluations?: MachineAnnotationEvaluation[];
}

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
export const TRAIT_DESCRIPTIONS: Record<TraitType, string> = {
  openness: 'Openness refers to the individual\'s receptiveness to new experiences, ideas, and perspectives. People high in openness typically have curiosity, creativity, and imagination, and enjoy trying new things.',
  conscientiousness: 'Conscientiousness refers to the individual\'s self-discipline, sense of responsibility, and organizational skills. People high in conscientiousness are typically careful, reliable, organized, and follow rules and plans strictly.',
  extraversion: 'Extraversion refers to the individual\'s level of activity in social interactions and tendency to seek stimulation. People high in extraversion are typically energetic, talkative, confident, and enjoy interacting with others.',
  agreeableness: 'Agreeableness refers to the individual\'s friendliness and level of cooperation when interacting with others. People high in agreeableness typically trust others, are compassionate, understanding, and willing to help others.',
  neuroticism: 'Neuroticism refers to the individual\'s tendency to experience negative emotions and emotional stability. People high in neuroticism may be more prone to anxiety, irritability, depression, and have poorer ability to cope with stress.'
}; 