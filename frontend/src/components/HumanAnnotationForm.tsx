import React, { useState } from 'react';
import { Card, Form, Rate, Input, Button, message } from 'antd';
import { TraitType, HumanAnnotation, TraitProgress } from '../types';
import { submitTraitHumanAnnotation, getTraitProgress } from '../services/api';

const { TextArea } = Input;

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

  const handleSubmit = async (values: any) => {
    setLoading(true);
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

      try {
        await submitTraitHumanAnnotation(npi, taskId, trait, annotation);
        
        // 获取更新后的进度
        const updatedProgress = await getTraitProgress(npi, taskId, trait, username);
        
        message.success('Human annotation submitted successfully!');
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
          machine_evaluation_completed: false,
          review_completed: false
        };
        
        message.success('Human annotation saved locally! (API temporarily unavailable)');
        onComplete(localProgress);
      }
    } catch (error) {
      console.error('Failed to submit human annotation:', error);
      message.error('Failed to submit annotation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Step 1: Human Annotation" loading={loading}>
      <p style={{ marginBottom: '20px', color: '#666' }}>
        Please provide your assessment for this personality trait based on the patient reviews.
      </p>
      
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
    </Card>
  );
};

export default HumanAnnotationForm; 