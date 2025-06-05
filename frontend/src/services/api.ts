import axios from 'axios';
import { 
  Physician, 
  Task, 
  ModelAnnotation, 
  HumanAnnotation, 
  ModelRanking 
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

// 提交人类标注
export const submitHumanAnnotations = async (annotations: HumanAnnotation[]): Promise<{message: string}> => {
  const response = await api.post('/annotations', annotations);
  return response.data;
};

// 提交模型排名
export const submitModelRanking = async (ranking: ModelRanking): Promise<{message: string}> => {
  const response = await api.post('/rankings', ranking);
  return response.data;
};

export default api; 