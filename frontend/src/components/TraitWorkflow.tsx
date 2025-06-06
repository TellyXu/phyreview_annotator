import React, { useState, useEffect } from 'react';
import { Card, Steps, Spin, Button, Alert } from 'antd';
import HumanAnnotationForm from './HumanAnnotationForm';
import MachineEvaluationForm from './MachineEvaluationForm';
import ReviewAndModifyForm from './ReviewAndModifyForm';
import { 
  TraitType, 
  TraitProgress, 
  WorkflowStage, 
  TRAIT_DISPLAY_NAMES,
  TRAIT_DESCRIPTIONS
} from '../types';

const { Step } = Steps;

// 调试日志函数
const logDebug = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[WORKFLOW ${timestamp}] ${message}`;
  console.log(formattedMessage);
  if (data) {
    console.log('Data:', data);
  }
  // 存储最近的日志用于显示
  const logs = JSON.parse(sessionStorage.getItem('debug_logs') || '[]');
  logs.push({ time: timestamp, message, data: data ? JSON.stringify(data) : undefined });
  // 只保留最近20条日志
  if (logs.length > 20) {
    logs.shift();
  }
  sessionStorage.setItem('debug_logs', JSON.stringify(logs));
};

interface TraitWorkflowProps {
  npi: string;
  taskId: number;
  username: string;
  trait: TraitType;
  progress: TraitProgress;
  onProgressUpdate: (progress: TraitProgress) => void;
  onComplete: () => void;
}

const TraitWorkflow: React.FC<TraitWorkflowProps> = ({
  npi,
  taskId,
  username,
  trait,
  progress,
  onProgressUpdate,
  onComplete
}) => {
  const [currentStage, setCurrentStage] = useState<WorkflowStage>('human_annotation');
  const [loading, setLoading] = useState(false);
  const [stageHistory, setStageHistory] = useState<{timestamp: string, from: string, to: string}[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 保存当前阶段到sessionStorage
  const saveStage = (stage: WorkflowStage) => {
    const key = `stage_${npi}_${taskId}_${trait}`;
    sessionStorage.setItem(key, stage);
    logDebug(`阶段已保存到sessionStorage: ${stage}`, {key});
  };

  // 根据进度确定当前阶段
  useEffect(() => {
    if (!progress) {
      logDebug('进度数据不存在，保持当前阶段', { currentStage });
      return;
    }

    const oldStage = currentStage;
    let newStage: WorkflowStage = oldStage;

    logDebug('根据进度更新阶段', {
      currentStage,
      progress,
      human_completed: progress.human_annotation_completed,
      machine_completed: progress.machine_evaluation_completed,
      review_completed: progress.review_completed
    });

    if (progress.review_completed) {
      newStage = 'completed';
    } else if (progress.machine_evaluation_completed) {
      newStage = 'review_and_modify';
    } else if (progress.human_annotation_completed) {
      newStage = 'machine_evaluation';
    } else {
      newStage = 'human_annotation';
    }

    if (oldStage !== newStage) {
      logDebug(`阶段转换: ${oldStage} -> ${newStage}`);
      setCurrentStage(newStage);
      saveStage(newStage);
      
      // 记录阶段历史
      const history = [...stageHistory, {
        timestamp: new Date().toISOString(),
        from: oldStage,
        to: newStage
      }];
      setStageHistory(history);
      sessionStorage.setItem(`stage_history_${npi}_${taskId}_${trait}`, JSON.stringify(history));
    }
  }, [progress, currentStage, npi, taskId, trait, stageHistory]);

  // 组件加载时尝试从sessionStorage恢复阶段
  useEffect(() => {
    try {
      const storedStage = sessionStorage.getItem(`stage_${npi}_${taskId}_${trait}`);
      const storedHistory = sessionStorage.getItem(`stage_history_${npi}_${taskId}_${trait}`);
      
      logDebug('组件加载，尝试恢复阶段', {
        storedStage,
        storedHistory
      });
      
      if (storedStage) {
        setCurrentStage(storedStage as WorkflowStage);
      }
      
      if (storedHistory) {
        setStageHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error('Failed to restore stage from sessionStorage:', e);
      logDebug('恢复阶段失败', e);
    }
  }, [npi, taskId, trait]);

  // 获取当前步骤索引
  const getCurrentStepIndex = (): number => {
    switch (currentStage) {
      case 'human_annotation': return 0;
      case 'machine_evaluation': return 1;
      case 'review_and_modify': return 2;
      case 'completed': return 3;
      default: return 0;
    }
  };

  // 强制设置阶段（用于调试或修复）
  const forceSetStage = (stage: WorkflowStage) => {
    logDebug(`手动强制设置阶段: ${stage}`, {
      previousStage: currentStage,
      progress
    });
    setCurrentStage(stage);
    saveStage(stage);
    
    // 更新进度
    const updatedProgress: TraitProgress = {
      ...progress,
      human_annotation_completed: stage !== 'human_annotation',
      machine_evaluation_completed: stage === 'review_and_modify' || stage === 'completed',
      review_completed: stage === 'completed'
    };
    
    logDebug('更新进度（由强制阶段变更）', updatedProgress);
    onProgressUpdate(updatedProgress);
    
    // 保存到sessionStorage
    const progressKey = `progress_${npi}_${taskId}_${trait}`;
    sessionStorage.setItem(progressKey, JSON.stringify(updatedProgress));
  };

  // 人类标注完成回调
  const handleHumanAnnotationComplete = (updatedProgress: TraitProgress) => {
    logDebug('人类标注完成回调', updatedProgress);
    onProgressUpdate(updatedProgress);
    setCurrentStage('machine_evaluation');
    saveStage('machine_evaluation');
  };

  // 机器评价完成回调
  const handleMachineEvaluationComplete = (updatedProgress: TraitProgress) => {
    logDebug('机器评价完成回调', updatedProgress);
    onProgressUpdate(updatedProgress);
    setCurrentStage('review_and_modify');
    saveStage('review_and_modify');
  };

  // 回顾完成回调
  const handleReviewComplete = () => {
    logDebug('回顾完成回调');
    const completedProgress: TraitProgress = {
      ...progress,
      review_completed: true
    };
    onProgressUpdate(completedProgress);
    setCurrentStage('completed');
    saveStage('completed');
    
    // 记录完成信息
    const completionKey = `completed_${npi}_${taskId}_${trait}`;
    sessionStorage.setItem(completionKey, 'true');
    
    onComplete();
  };

  // 渲染当前阶段的内容
  const renderCurrentStage = () => {
    logDebug('渲染当前阶段', { 
      stage: currentStage, 
      progress: progress || 'No progress data'
    });
    
    if (!progress) {
      return <Spin size="large" />;
    }

    switch (currentStage) {
      case 'human_annotation':
        return (
          <HumanAnnotationForm
            npi={npi}
            taskId={taskId}
            username={username}
            trait={trait}
            onComplete={handleHumanAnnotationComplete}
          />
        );
      
      case 'machine_evaluation':
        return (
          <MachineEvaluationForm
            npi={npi}
            taskId={taskId}
            username={username}
            trait={trait}
            onComplete={handleMachineEvaluationComplete}
          />
        );
      
      case 'review_and_modify':
        return (
          <ReviewAndModifyForm
            npi={npi}
            taskId={taskId}
            username={username}
            trait={trait}
            onComplete={handleReviewComplete}
          />
        );
      
      case 'completed':
        return (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <h3 style={{ color: '#52c41a' }}>
                ✅ {TRAIT_DISPLAY_NAMES[trait]} Completed!
              </h3>
              <p>You have successfully completed all steps for this personality trait.</p>
            </div>
          </Card>
        );
      
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      {/* Trait 描述 */}
      <Card style={{ marginBottom: '20px' }}>
        <h3>{TRAIT_DISPLAY_NAMES[trait]}</h3>
        <p style={{ color: '#666', fontSize: '14px' }}>
          {TRAIT_DESCRIPTIONS[trait]}
        </p>
      </Card>

      {/* 调试信息 */}
      <Card style={{ marginBottom: '20px', display: 'none' }} id="debug-card">
        <h4>Debug Info:</h4>
        <p>Current Stage: {currentStage}</p>
        <p>Progress: {JSON.stringify(progress)}</p>
        <div>
          <Button 
            size="small" 
            onClick={() => forceSetStage('human_annotation')}
            style={{ marginRight: 8 }}
          >
            Force Human
          </Button>
          <Button 
            size="small" 
            onClick={() => forceSetStage('machine_evaluation')}
            style={{ marginRight: 8 }}
          >
            Force Machine
          </Button>
          <Button 
            size="small" 
            onClick={() => forceSetStage('review_and_modify')}
            style={{ marginRight: 8 }}
          >
            Force Review
          </Button>
          <Button 
            size="small" 
            onClick={() => forceSetStage('completed')}
          >
            Force Complete
          </Button>
        </div>
        <p>
          <small>
            <a href="#" onClick={(e) => {
              e.preventDefault();
              document.getElementById('debug-card')!.style.display = 'none';
            }}>
              Hide Debug
            </a>
          </small>
        </p>
      </Card>
      
      {/* 错误提示 */}
      {error && (
        <Alert
          message="Workflow Error"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 进度步骤 */}
      <Card style={{ marginBottom: '20px' }}>
        <Steps current={getCurrentStepIndex()} size="small">
          <Step 
            title="Human Annotation" 
            description="Provide your own assessment"
          />
          <Step 
            title="Machine Evaluation" 
            description="Evaluate AI model outputs"
          />
          <Step 
            title="Review & Modify" 
            description="Review and finalize"
          />
          <Step 
            title="Completed" 
            description="All done!"
          />
        </Steps>
        
        {/* 调试按钮 */}
        <div style={{ marginTop: 8, textAlign: 'right' }}>
          <Button 
            type="link" 
            size="small"
            onClick={() => {
              document.getElementById('debug-card')!.style.display = 
                document.getElementById('debug-card')!.style.display === 'none' ? 'block' : 'none';
            }}
          >
            Debug
          </Button>
        </div>
      </Card>

      {/* 当前阶段内容 */}
      <div style={{ minHeight: '400px' }}>
        {loading ? <Spin size="large" /> : renderCurrentStage()}
      </div>
    </div>
  );
};

export default TraitWorkflow; 