import React, { useState } from 'react';
import { Card, Form, Rate, Input, Button, message, Spin, Alert, Collapse } from 'antd';
import { TraitType, HumanAnnotation, TraitProgress } from '../types';
import { submitTraitHumanAnnotation, getTraitProgress } from '../services/api';

const { TextArea } = Input;
const { Panel } = Collapse;

// 从环境变量获取API URL，用于调试
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

// 调试日志函数
const logDebug = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[DEBUG ${timestamp}] ${message}`;
  console.log(formattedMessage);
  if (data) {
    console.log('Data:', data);
  }
  // 存储最近的日志用于显示
  const logs = JSON.parse(sessionStorage.getItem('debug_logs') || '[]');
  logs.push({ time: timestamp, message, data: data ? JSON.stringify(data) : undefined });
  // 只保留最近10条日志
  if (logs.length > 10) {
    logs.shift();
  }
  sessionStorage.setItem('debug_logs', JSON.stringify(logs));
};

interface HumanAnnotationFormProps {
  npi: string;
  taskId: number;
  username: string;
  trait: TraitType;
  onComplete: (progress: TraitProgress) => void;
}

const HumanAnnotationForm: React.FC<HumanAnnotationFormProps> = ({
  npi,
  taskId,
  username,
  trait,
  onComplete
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitCount, setSubmitCount] = useState(0);
  const [showDebug, setShowDebug] = useState(false);
  const [debugLogs, setDebugLogs] = useState<{time: string, message: string, data?: string}[]>([]);

  // 在组件渲染时更新调试日志
  React.useEffect(() => {
    try {
      const logs = JSON.parse(sessionStorage.getItem('debug_logs') || '[]');
      setDebugLogs(logs);
    } catch (e) {
      console.error('Failed to parse debug logs:', e);
    }
  }, [submitCount]); // 每次提交后更新日志

  const handleSubmit = async (values: any) => {
    setLoading(true);
    setApiError(null);
    setSubmitCount(prev => prev + 1); // 增加提交计数
    
    // 记录表单提交
    logDebug(`提交表单数据 (尝试 #${submitCount + 1})`, {
      npi, 
      taskId, 
      trait, 
      username,
      values
    });

    try {
      const annotation: HumanAnnotation = {
        physician_id: parseInt(npi), // 这里需要转换为physician_id
        evaluator: username,
        task_id: taskId,
        trait: trait,
        score: values.score,
        consistency: values.consistency,
        sufficiency: values.sufficiency,
        evidence: values.evidence || ''
      };

      logDebug('准备调用API', {
        url: `${API_URL}/physician/${npi}/task/${taskId}/trait/${trait}/human-annotation`,
        data: annotation
      });

      try {
        // 执行API调用
        const result = await submitTraitHumanAnnotation(npi, taskId, trait, annotation);
        logDebug('API调用成功', result);
        
        // 获取更新后的进度
        logDebug('获取最新进度');
        const updatedProgress = await getTraitProgress(npi, taskId, trait, username);
        logDebug('进度获取成功', updatedProgress);
        
        message.success('Human annotation submitted successfully!');
        
        // 显式地将进度写入sessionStorage用于调试
        const storageKey = `progress_${npi}_${taskId}_${trait}`;
        sessionStorage.setItem(storageKey, JSON.stringify(updatedProgress));
        logDebug('进度已存入sessionStorage', {key: storageKey});
        
        // 调用父组件的回调
        logDebug('调用onComplete回调', updatedProgress);
        onComplete(updatedProgress);
        
        // 延迟确认状态转换
        setTimeout(() => {
          logDebug('提交后状态确认检查');
          const storedProgress = sessionStorage.getItem(storageKey);
          if (storedProgress) {
            logDebug('存储的进度状态', JSON.parse(storedProgress));
          }
        }, 1000);
      } catch (apiError: any) {
        const errorDetails = {
          url: apiError.config?.url,
          method: apiError.config?.method,
          status: apiError.response?.status,
          data: apiError.response?.data,
          message: apiError.message
        };
        
        logDebug('API调用失败', errorDetails);
        setApiError(`${apiError.message}: ${JSON.stringify(errorDetails)}`);
        
        // 显示具体的错误信息
        if (apiError.response?.status === 404) {
          message.error('API endpoint not found. Please check backend deployment.');
        } else if (apiError.code === 'ERR_NETWORK') {
          message.error('Network error. Please check if the backend is running.');
        } else {
          message.warning('Failed to connect to server. Using offline mode.');
        }
        
        // 如果API失败，创建本地的进度状态
        const localProgress: TraitProgress = {
          physician_id: parseInt(npi),
          task_id: taskId,
          evaluator: username,
          trait: trait,
          human_annotation_completed: true,
          machine_evaluation_completed: false,
          review_completed: false
        };
        
        logDebug('使用本地进度', localProgress);
        
        // 显式地将进度写入sessionStorage
        const storageKey = `progress_${npi}_${taskId}_${trait}`;
        sessionStorage.setItem(storageKey, JSON.stringify(localProgress));
        
        // 延迟一下，确保用户看到消息
        setTimeout(() => {
          logDebug('调用onComplete回调(本地进度)', localProgress);
          onComplete(localProgress);
          
          // 二次确认回调是否生效
          setTimeout(() => {
            logDebug('本地进度回调后状态检查');
            try {
              const currentStage = sessionStorage.getItem(`stage_${npi}_${taskId}_${trait}`);
              logDebug('当前阶段', { stage: currentStage || '未知' });
            } catch (e) {
              logDebug('状态检查失败', { error: e });
            }
          }, 500);
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to submit human annotation:', error);
      logDebug('提交过程中发生错误', error);
      setApiError(`General error: ${error}`);
      message.error('Failed to submit annotation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 切换调试面板
  const toggleDebug = () => {
    setShowDebug(!showDebug);
  };

  return (
    <Card title="Step 1: Human Annotation" loading={loading}>
      <p style={{ marginBottom: '20px', color: '#666' }}>
        Please provide your assessment for this personality trait based on the patient reviews.
      </p>
      
      {/* API错误提示 */}
      {apiError && (
        <Alert
          message="API Error"
          description={apiError}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      
      <Form 
        form={form}
        onFinish={handleSubmit}
        layout="vertical"
        requiredMark={false}
      >
        <Form.Item
          name="score"
          label="Score (1-5 scale)"
          rules={[{ required: true, message: 'Please provide a score' }]}
        >
          <Rate 
            count={5}
            tooltips={['Very Low', 'Low', 'Moderate', 'High', 'Very High']}
          />
        </Form.Item>

        <Form.Item
          name="consistency"
          label="Consistency (1-5 scale)"
          rules={[{ required: true, message: 'Please rate consistency' }]}
          help="How consistent is this trait across multiple reviews?"
        >
          <Rate 
            count={5}
            tooltips={['Very Inconsistent', 'Inconsistent', 'Moderate', 'Consistent', 'Very Consistent']}
          />
        </Form.Item>

        <Form.Item
          name="sufficiency"
          label="Sufficiency (1-5 scale)"
          rules={[{ required: true, message: 'Please rate sufficiency' }]}
          help="How sufficient is the evidence for this trait?"
        >
          <Rate 
            count={5}
            tooltips={['Very Insufficient', 'Insufficient', 'Moderate', 'Sufficient', 'Very Sufficient']}
          />
        </Form.Item>

        <Form.Item
          name="evidence"
          label="Evidence & Reasoning"
          rules={[{ required: true, message: 'Please provide evidence' }]}
        >
          <TextArea 
            rows={4}
            placeholder="Please provide 2-3 sentences combining reasoning with direct quotes or paraphrased examples from the reviews..."
          />
        </Form.Item>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit"
            loading={loading}
            size="large"
            style={{ width: '100%' }}
          >
            Submit Human Annotation
          </Button>
        </Form.Item>
      </Form>
      
      {/* 调试按钮和面板 */}
      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <Button type="link" onClick={toggleDebug} size="small">
          {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
        </Button>
      </div>
      
      {showDebug && (
        <Collapse>
          <Panel header="Debug Information" key="1">
            <div style={{ maxHeight: '300px', overflow: 'auto' }}>
              <p><strong>API URL:</strong> {API_URL}</p>
              <p><strong>NPI:</strong> {npi}</p>
              <p><strong>Task ID:</strong> {taskId}</p>
              <p><strong>Trait:</strong> {trait}</p>
              <p><strong>Username:</strong> {username}</p>
              <p><strong>Submit Count:</strong> {submitCount}</p>
              <p><strong>Form Values:</strong> {form.getFieldsValue() ? JSON.stringify(form.getFieldsValue()) : 'No values'}</p>
              <h4>Debug Logs:</h4>
              {debugLogs.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {debugLogs.map((log, index) => (
                    <li key={index} style={{ borderBottom: '1px solid #eee', padding: '8px 0' }}>
                      <strong>{log.time}</strong>: {log.message}
                      {log.data && <pre style={{ background: '#f5f5f5', padding: 4 }}>{log.data}</pre>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No logs available</p>
              )}
              <h4>Current Session Storage:</h4>
              <pre style={{ background: '#f5f5f5', padding: 8, maxHeight: '150px', overflow: 'auto' }}>
                {Object.keys(sessionStorage).map(key => {
                  try {
                    return `${key}: ${JSON.stringify(JSON.parse(sessionStorage.getItem(key) || ''), null, 2)}\n`;
                  } catch (e) {
                    return `${key}: ${sessionStorage.getItem(key)}\n`;
                  }
                })}
              </pre>
            </div>
            <Button 
              onClick={() => {
                sessionStorage.removeItem('debug_logs');
                setDebugLogs([]);
                message.success('Debug logs cleared');
              }} 
              size="small" 
              danger
            >
              Clear Logs
            </Button>
          </Panel>
        </Collapse>
      )}
    </Card>
  );
};

export default HumanAnnotationForm; 