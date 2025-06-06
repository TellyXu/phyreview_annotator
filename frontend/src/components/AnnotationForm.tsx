import React, { useState } from 'react';
import { Form, InputNumber, Input, Button, Card, Typography, Row, Col, Slider, Modal, Divider, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { HumanAnnotation, TraitType, TRAIT_DESCRIPTIONS, ANNOTATION_GUIDELINE, TRAIT_DISPLAY_NAMES } from '../types';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface AnnotationFormProps {
  physicianId: number;
  taskId: number;
  username: string;
  onSubmit: (annotations: HumanAnnotation[]) => void;
}

const traits: TraitType[] = [
  'openness',
  'conscientiousness',
  'extraversion',
  'agreeableness',
  'neuroticism'
];

const marks = {
  1: '1',
  2: '2',
  3: '3',
  4: '4',
  5: '5'
};

const consistencyMarks = {
  1: 'Low',
  2: 'Medium',
  3: 'High'
};

const AnnotationForm: React.FC<AnnotationFormProps> = ({ physicianId, taskId, username, onSubmit }) => {
  const [form] = Form.useForm();
  const [guidelineVisible, setGuidelineVisible] = useState(false);

  const handleSubmit = (values: any) => {
    const annotations: HumanAnnotation[] = [];

    traits.forEach(trait => {
      annotations.push({
        physician_id: physicianId,
        evaluator: username,
        task_id: taskId,
        trait: trait,
        score: values[`${trait}_score`],
        consistency: values[`${trait}_consistency`],
        sufficiency: values[`${trait}_sufficiency`],
        evidence: values[`${trait}_evidence`]
      });
    });

    onSubmit(annotations);
  };

  // Show annotation guidelines
  const showGuideline = () => {
    setGuidelineVisible(true);
  };

  return (
    <>
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button type="link" onClick={showGuideline}>View Annotation Guidelines</Button>
      </div>
      
      <Form
        form={form}
        onFinish={handleSubmit}
        layout="vertical"
      >
        {traits.map(trait => (
          <div key={trait} style={{ marginBottom: 24 }}>
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span>{TRAIT_DISPLAY_NAMES[trait]}</span>
                  <Tooltip title={TRAIT_DESCRIPTIONS[trait]}>
                    <InfoCircleOutlined style={{ marginLeft: 8 }} />
                  </Tooltip>
                </div>
              }
              type="inner"
            >
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Form.Item
                    name={`${trait}_score`}
                    label="Score"
                    rules={[{ required: true, message: 'Please select a score' }]}
                  >
                    <Slider marks={marks} min={1} max={5} />
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    name={`${trait}_consistency`}
                    label="Consistency"
                    rules={[{ required: true, message: 'Please select consistency' }]}
                  >
                    <Slider marks={consistencyMarks} min={1} max={3} />
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    name={`${trait}_sufficiency`}
                    label="Sufficiency"
                    rules={[{ required: true, message: 'Please select sufficiency' }]}
                  >
                    <Slider marks={consistencyMarks} min={1} max={3} />
                  </Form.Item>
                </Col>
                
                <Col span={24}>
                  <Form.Item
                    name={`${trait}_evidence`}
                    label="Evidence"
                    rules={[{ required: true, message: 'Please provide evidence' }]}
                  >
                    <TextArea rows={4} placeholder={`Please provide evidence and reasoning for ${TRAIT_DISPLAY_NAMES[trait]}...`} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </div>
        ))}
        
        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Submit Annotation
          </Button>
        </Form.Item>
      </Form>
      
      <Modal
        title="Annotation Guidelines"
        open={guidelineVisible}
        onCancel={() => setGuidelineVisible(false)}
        footer={[
          <Button key="close" onClick={() => setGuidelineVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        <Paragraph style={{ whiteSpace: 'pre-line' }}>
          {ANNOTATION_GUIDELINE}
        </Paragraph>
        
        <Divider />
        
        <Title level={5}>Trait Descriptions</Title>
        {traits.map(trait => (
          <div key={trait} style={{ marginBottom: 16 }}>
            <Text strong>{TRAIT_DISPLAY_NAMES[trait]}: </Text>
            <Text>{TRAIT_DESCRIPTIONS[trait]}</Text>
          </div>
        ))}
      </Modal>
    </>
  );
};

export default AnnotationForm; 