import React, { useState } from 'react';
import { Card, Typography, Button, Row, Col, Select, Checkbox, Tag, Space } from 'antd';
import { UpOutlined, DownOutlined } from '@ant-design/icons';
import { ModelAnnotation, TraitType, TRAIT_DISPLAY_NAMES } from '../types';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// Temporary interface for compatibility
interface ModelRanking {
  physician_id: number;
  task_id: number;
  evaluator: string;
  model_ranks: string;
  convinced: boolean;
  error_model: string;
}

interface ModelEvaluationFormProps {
  physicianId: number;
  taskId: number;
  username: string;
  modelAnnotations: ModelAnnotation[];
  onSubmit: (ranking: ModelRanking) => void;
}

interface ModelGroup {
  modelName: string;
  annotations: ModelAnnotation[];
}

interface TraitGroup {
  trait: TraitType;
  annotations: ModelAnnotation[];
}

// Get color for score
const getScoreColor = (score: string): string => {
  const colorMap: { [key: string]: string } = {
    'No Evidence': '#8c8c8c',
    'Low': '#ff4d4f',
    'Low to Moderate': '#ff7a45',
    'Moderate': '#faad14',
    'Moderate to High': '#52c41a',
    'High': '#1890ff'
  };
  return colorMap[score] || '#722ed1';
};

// Get color for consistency/sufficiency
const getConsistencyColor = (level: string): string => {
  const colorMap: { [key: string]: string } = {
    'Low': '#ff4d4f',
    'Moderate': '#faad14',
    'High': '#52c41a'
  };
  return colorMap[level] || '#722ed1';
};

// Group model annotations by model
const groupAnnotationsByModel = (annotations: ModelAnnotation[]): ModelGroup[] => {
  const groups: { [key: string]: ModelAnnotation[] } = {};
  
  annotations.forEach(annotation => {
    if (!groups[annotation.model_name]) {
      groups[annotation.model_name] = [];
    }
    groups[annotation.model_name].push(annotation);
  });
  
  return Object.keys(groups).map(modelName => ({
    modelName,
    annotations: groups[modelName]
  }));
};

// Group model annotations by trait
const groupAnnotationsByTrait = (annotations: ModelAnnotation[]): TraitGroup[] => {
  const traits: TraitType[] = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
  
  return traits.map(trait => ({
    trait,
    annotations: annotations.filter(a => a.trait === trait)
  }));
};

const ModelEvaluationForm: React.FC<ModelEvaluationFormProps> = ({ 
  physicianId, 
  taskId, 
  username, 
  modelAnnotations, 
  onSubmit 
}) => {
  const modelGroups = groupAnnotationsByModel(modelAnnotations);
  const traitGroups = groupAnnotationsByTrait(modelAnnotations);
  const [modelRanks, setModelRanks] = useState<string[]>(modelGroups.map(group => group.modelName));
  const [convinced, setConvinced] = useState<boolean>(false);
  const [errorModel, setErrorModel] = useState<string>('');
  
  // Move item up in ranking
  const moveUp = (index: number) => {
    if (index > 0) {
      const newRanks = [...modelRanks];
      [newRanks[index], newRanks[index - 1]] = [newRanks[index - 1], newRanks[index]];
      setModelRanks(newRanks);
    }
  };

  // Move item down in ranking
  const moveDown = (index: number) => {
    if (index < modelRanks.length - 1) {
      const newRanks = [...modelRanks];
      [newRanks[index], newRanks[index + 1]] = [newRanks[index + 1], newRanks[index]];
      setModelRanks(newRanks);
    }
  };
  
  // Handle submission
  const handleSubmit = () => {
    // Create model ranking object
    const ranking: ModelRanking = {
      physician_id: physicianId,
      task_id: taskId,
      evaluator: username,
      model_ranks: JSON.stringify(modelRanks),
      convinced: convinced,
      error_model: errorModel
    };
    
    // Call submit function
    onSubmit(ranking);
  };
  
  // Render annotations for a single trait
  const renderTraitAnnotations = (traitGroup: TraitGroup) => {
    return (
      <Card 
        key={traitGroup.trait}
        title={<Title level={4} style={{ margin: 0 }}>{TRAIT_DISPLAY_NAMES[traitGroup.trait]}</Title>}
        style={{ marginBottom: 24 }}
      >
        {traitGroup.annotations.map((annotation, index) => (
          <Card
            key={`${annotation.model_name}-${annotation.trait}`}
            type="inner"
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text strong style={{ fontSize: '16px' }}>{annotation.model_name}</Text>
                <div>
                  <Tag color={getScoreColor(annotation.score)} style={{ marginLeft: 8 }}>
                    Score: {annotation.score}
                  </Tag>
                  <Tag color={getConsistencyColor(annotation.consistency)}>
                    Consistency: {annotation.consistency}
                  </Tag>
                  <Tag color={getConsistencyColor(annotation.sufficiency)}>
                    Sufficiency: {annotation.sufficiency}
                  </Tag>
                </div>
              </div>
            }
            style={{ marginBottom: 16 }}
          >
            <Paragraph style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
              <Text strong>Evidence: </Text>
              {annotation.evidence}
            </Paragraph>
          </Card>
        ))}
      </Card>
    );
  };

  // Get ranking badge color
  const getRankingColor = (index: number): string => {
    switch (index) {
      case 0: return '#52c41a'; // Green for 1st
      case 1: return '#faad14'; // Orange for 2nd  
      case 2: return '#ff7a45'; // Light orange for 3rd
      default: return '#d9d9d9'; // Gray for others
    }
  };

  // Get ranking emoji
  const getRankingEmoji = (index: number): string => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `${index + 1}`;
    }
  };

  // Render ranking section
  const renderRankingSection = () => {
    return (
      <Card title={<Title level={4} style={{ margin: 0 }}>Model Ranking</Title>} style={{ marginTop: 32 }}>
        <Paragraph style={{ marginBottom: 16, fontSize: '14px' }}>
          Use the ↑↓ buttons to rank the models. The model at the top is the one you consider the best.
        </Paragraph>
        
        <div style={{ marginBottom: 24 }}>
          {modelRanks.map((modelName, index) => (
            <Card 
              key={modelName}
              size="small"
              style={{ 
                marginBottom: 8,
                border: `2px solid ${getRankingColor(index)}`,
                backgroundColor: index === 0 ? '#f6ffed' : 
                              index === 1 ? '#fff7e6' : 
                              index === 2 ? '#fff2e8' : '#fafafa'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Text strong style={{ fontSize: '18px', marginRight: 8 }}>
                    {getRankingEmoji(index)}
                  </Text>
                  <Text strong style={{ fontSize: '16px' }}>
                    {modelName}
                  </Text>
                </div>
                <Space>
                  <Button 
                    type="text" 
                    icon={<UpOutlined />} 
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    title="Move up"
                  />
                  <Button 
                    type="text" 
                    icon={<DownOutlined />} 
                    onClick={() => moveDown(index)}
                    disabled={index === modelRanks.length - 1}
                    title="Move down"
                  />
                </Space>
              </div>
            </Card>
          ))}
        </div>
        
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card size="small">
              <Checkbox 
                checked={convinced} 
                onChange={(e) => setConvinced(e.target.checked)}
              >
                Were you convinced by any model's analysis?
              </Checkbox>
            </Card>
          </Col>
          
          <Col span={24}>
            <Card size="small">
              <div style={{ marginBottom: 8 }}>Which model has obvious errors?</div>
              <Select
                placeholder="Select a model"
                style={{ width: '100%' }}
                value={errorModel || undefined}
                onChange={setErrorModel}
                allowClear
              >
                {modelGroups.map(group => (
                  <Option key={group.modelName} value={group.modelName}>{group.modelName}</Option>
                ))}
              </Select>
            </Card>
          </Col>
        </Row>
        
        <Button 
          type="primary" 
          onClick={handleSubmit} 
          style={{ marginTop: 24, width: '100%' }}
        >
          Submit Evaluation
        </Button>
      </Card>
    );
  };
  
  return (
    <>
      <Title level={3} style={{ marginBottom: 24 }}>Model Annotations by Trait</Title>
      
      {/* Trait-based annotations */}
      {traitGroups.map(traitGroup => renderTraitAnnotations(traitGroup))}
      
      {/* Ranking section */}
      {renderRankingSection()}
    </>
  );
};

export default ModelEvaluationForm; 