import axios from 'axios';
import { 
  Physician, 
  Task, 
  ModelAnnotation, 
  HumanAnnotation, 
  TraitProgress,
  MachineAnnotationEvaluation,
  TraitType
} from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 根据NPI号码获取医生信息
export const getPhysicianByNPI = async (npi: string): Promise<Physician> => {
  const response = await api.get(`/physician/${npi}`);
  return response.data;
};

// 获取医生任务信息
export const getPhysicianTask = async (npi: string, taskId: number, username: string): Promise<{
  task: Task;
  model_annotations: ModelAnnotation[];
}> => {
  const response = await api.get(`/physician/${npi}/task/${taskId}?username=${username}`);
  return response.data;
};

// 提交人类标注（旧版本，保持兼容性）
export const submitHumanAnnotations = async (annotations: HumanAnnotation[]): Promise<{message: string}> => {
  const response = await api.post('/annotations', annotations);
  return response.data;
};

// === 新的trait相关API ===

// 获取trait进度
export const getTraitProgress = async (npi: string, taskId: number, trait: TraitType, username: string): Promise<TraitProgress> => {
  const response = await api.get(`/physician/${npi}/task/${taskId}/trait/${trait}/progress?username=${username}`);
  return response.data;
};

// 提交单个trait的人类标注
export const submitTraitHumanAnnotation = async (
  npi: string, 
  taskId: number, 
  trait: TraitType, 
  annotation: HumanAnnotation
): Promise<{message: string}> => {
  const response = await api.post(`/physician/${npi}/task/${taskId}/trait/${trait}/human-annotation`, annotation);
  return response.data;
};

// 获取指定trait的机器标注
export const getTraitMachineAnnotations = async (
  npi: string, 
  taskId: number, 
  trait: TraitType
): Promise<ModelAnnotation[]> => {
  const response = await api.get(`/physician/${npi}/task/${taskId}/trait/${trait}/machine-annotations`);
  return response.data;
};

// 提交机器标注评价
export const submitMachineAnnotationEvaluation = async (
  npi: string, 
  taskId: number, 
  trait: TraitType, 
  evaluations: MachineAnnotationEvaluation[]
): Promise<{message: string}> => {
  const response = await api.post(`/physician/${npi}/task/${taskId}/trait/${trait}/machine-evaluation`, evaluations);
  return response.data;
};

// 获取trait历史数据
export const getTraitHistory = async (
  npi: string, 
  taskId: number, 
  trait: TraitType, 
  username: string
): Promise<{
  human_annotation?: HumanAnnotation;
  machine_evaluations: MachineAnnotationEvaluation[];
}> => {
  const response = await api.get(`/physician/${npi}/task/${taskId}/trait/${trait}/history?username=${username}`);
  return response.data;
};

// 完成trait回顾
export const completeTraitReview = async (
  npi: string, 
  taskId: number, 
  trait: TraitType, 
  evaluator: string,
  comment?: string
): Promise<{message: string}> => {
  const response = await api.post(`/physician/${npi}/task/${taskId}/trait/${trait}/complete`, {
    evaluator,
    comment
  });
  return response.data;
};

export default api; 