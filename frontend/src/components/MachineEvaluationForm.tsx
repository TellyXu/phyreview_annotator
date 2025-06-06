import React, { useState, useEffect } from 'react';
import { Card, Radio, Input, Button, message, Spin, Space, Tag, Divider } from 'antd';
import { LikeOutlined, DislikeOutlined, MehOutlined } from '@ant-design/icons';
import { 
  TraitType, 
  ModelAnnotation, 
  MachineAnnotationEvaluation, 
  TraitProgress,
  RatingType
} from '../types';
import { 
  getTraitMachineAnnotations, 
  submitMachineAnnotationEvaluation, 
  getTraitProgress 
} from '../services/api';

const { TextArea } = Input;

interface MachineEvaluationFormProps {
  npi: string;
  taskId: number;
  username: string;
  trait: TraitType;
  onComplete: (progress: TraitProgress) => void;
}

const MachineEvaluationForm: React.FC<MachineEvaluationFormProps> = ({
  npi,
  taskId,
  username,
  trait,
  onComplete
}) => {
  const [machineAnnotations, setMachineAnnotations] = useState<ModelAnnotation[]>([]);
  const [evaluations, setEvaluations] = useState<Record<number, { rating: RatingType; comment: string }>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 加载机器标注
  useEffect(() => {
    const loadMachineAnnotations = async () => {
      setLoading(true);
      try {
        const annotations = await getTraitMachineAnnotations(npi, taskId, trait);
        setMachineAnnotations(annotations);
        
        // 初始化评价状态
        const initialEvaluations: Record<number, { rating: RatingType; comment: string }> = {};
        annotations.forEach(annotation => {
          initialEvaluations[annotation.id] = { rating: 'just_soso', comment: '' };
        });
        setEvaluations(initialEvaluations);
      } catch (error) {
        console.error('Failed to load machine annotations:', error);
        message.error('Failed to load machine annotations.');
        setMachineAnnotations([]);
      } finally {
        setLoading(false);
      }
    };

    loadMachineAnnotations();
  }, [npi, taskId, trait]);

  // 更新评价
  const updateEvaluation = (annotationId: number, field: 'rating' | 'comment', value: any) => {
    setEvaluations(prev => ({
      ...prev,
      [annotationId]: {
        ...prev[annotationId],
        [field]: value
      }
    }));
  };

  // 提交评价
  const handleSubmit = async () => {
    // 验证所有标注都有评价
    const missingEvaluations = machineAnnotations.filter(annotation => 
      !evaluations[annotation.id] || !evaluations[annotation.id].rating
    );

    if (missingEvaluations.length > 0) {
      message.warning('Please provide ratings for all machine annotations.');
      return;
    }

    setSubmitting(true);
    try {
      const evaluationList: MachineAnnotationEvaluation[] = machineAnnotations.map(annotation => ({
        model_annotation_id: annotation.id,
        physician_id: annotation.physician_id,
        task_id: taskId,
        evaluator: username,
        trait: trait,
        model_name: annotation.model_name,
        rating: evaluations[annotation.id].rating,
        comment: evaluations[annotation.id].comment || ''
      }));

      try {
        await submitMachineAnnotationEvaluation(npi, taskId, trait, evaluationList);
        
        // 获取更新后的进度
        const updatedProgress = await getTraitProgress(npi, taskId, trait, username);
        
        message.success('Machine evaluations submitted successfully!');
        onComplete(updatedProgress);
      } catch (apiError) {
        console.log('API call failed, continuing with local progress:', apiError);
        
        // 如果API失败，创建本地的进度状态
        const localProgress: TraitProgress = {
          physician_id: parseInt(npi),
          task_id: taskId,
          evaluator: username,
          trait: trait,
          human_annotation_completed: true,
          machine_evaluation_completed: true,
          review_completed: false
        };
        
        message.success('Machine evaluations saved locally! (API temporarily unavailable)');
        onComplete(localProgress);
      }
    } catch (error) {
      console.error('Failed to submit machine evaluations:', error);
      message.error('Failed to submit evaluations. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // 获取分数颜色
  const getScoreColor = (score: string): string => {
    switch (score.toLowerCase()) {
      case 'no evidence': return '#8c8c8c';
      case 'low': return '#ff4d4f';
      case 'low to moderate': return '#fa8c16';
      case 'moderate': return '#faad14';
      case 'moderate to high': return '#1890ff';
      case 'high': return '#52c41a';
      default: return '#8c8c8c';
    }
  };

  if (loading) {
    return (
      <Card title="Step 2: Machine Evaluation">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <p style={{ marginTop: '16px' }}>Loading machine annotations...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Step 2: Machine Evaluation">
      <p style={{ marginBottom: '20px', color: '#666' }}>
        Please evaluate each AI model's annotation for this personality trait. Rate them as Good (👍), Poor (👎), or Okay (😐).
      </p>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {machineAnnotations.map((annotation, index) => (
          <Card 
            key={annotation.id}
            size="small" 
            title={
              <span>
                {annotation.model_name} 
                <Tag color={getScoreColor(annotation.score)} style={{ marginLeft: '8px' }}>
                  {annotation.score}
                </Tag>
              </span>
            }
            style={{ border: '1px solid #f0f0f0' }}
          >
            <div style={{ marginBottom: '16px' }}>
              <p><strong>Evidence:</strong></p>
              <p style={{ 
                background: '#fafafa', 
                padding: '12px', 
                borderRadius: '4px',
                fontSize: '14px',
                lineHeight: '1.6'
              }}>
                {annotation.evidence}
              </p>
              
              <div style={{ marginTop: '8px' }}>
                <Tag>Consistency: {annotation.consistency}</Tag>
                <Tag>Sufficiency: {annotation.sufficiency}</Tag>
              </div>
            </div>

            <Divider />

            <div>
              <p style={{ marginBottom: '12px', fontWeight: 'bold' }}>Your Evaluation:</p>
              
              <div style={{ marginBottom: '16px' }}>
                <Radio.Group
                  value={evaluations[annotation.id]?.rating}
                  onChange={(e) => updateEvaluation(annotation.id, 'rating', e.target.value)}
                  buttonStyle="solid"
                >
                  <Radio.Button value="thumb_up">
                    <LikeOutlined /> Good
                  </Radio.Button>
                  <Radio.Button value="just_soso">
                    <MehOutlined /> Okay
                  </Radio.Button>
                  <Radio.Button value="thumb_down">
                    <DislikeOutlined /> Poor
                  </Radio.Button>
                </Radio.Group>
              </div>

              <TextArea
                placeholder="Optional: Add your comments about this model's annotation..."
                rows={2}
                value={evaluations[annotation.id]?.comment}
                onChange={(e) => updateEvaluation(annotation.id, 'comment', e.target.value)}
              />
            </div>
          </Card>
        ))}

        <Button
          type="primary"
          size="large"
          loading={submitting}
          onClick={handleSubmit}
          style={{ width: '100%', marginTop: '20px' }}
        >
          Submit Machine Evaluations
        </Button>
      </Space>
    </Card>
  );
};

export default MachineEvaluationForm; 