import React, { useState, useEffect } from 'react';
import { Card, Steps, Spin } from 'antd';
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
  const loading = false; // Loading state for future use

  // 根据进度确定当前阶段
  useEffect(() => {
    if (!progress) return;

    if (progress.review_completed) {
      setCurrentStage('completed');
    } else if (progress.machine_evaluation_completed) {
      setCurrentStage('review_and_modify');
    } else if (progress.human_annotation_completed) {
      setCurrentStage('machine_evaluation');
    } else {
      setCurrentStage('human_annotation');
    }
  }, [progress]);

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

  // 人类标注完成回调
  const handleHumanAnnotationComplete = (updatedProgress: TraitProgress) => {
    onProgressUpdate(updatedProgress);
    setCurrentStage('machine_evaluation');
  };

  // 机器评价完成回调
  const handleMachineEvaluationComplete = (updatedProgress: TraitProgress) => {
    onProgressUpdate(updatedProgress);
    setCurrentStage('review_and_modify');
  };

  // 回顾完成回调
  const handleReviewComplete = () => {
    const completedProgress: TraitProgress = {
      ...progress,
      review_completed: true
    };
    onProgressUpdate(completedProgress);
    setCurrentStage('completed');
    onComplete();
  };

  // 渲染当前阶段的内容
  const renderCurrentStage = () => {
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
      </Card>

      {/* 当前阶段内容 */}
      <div style={{ minHeight: '400px' }}>
        {loading ? <Spin size="large" /> : renderCurrentStage()}
      </div>
    </div>
  );
};

export default TraitWorkflow; 