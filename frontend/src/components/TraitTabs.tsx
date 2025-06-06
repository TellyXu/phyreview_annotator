import React, { useState, useEffect } from 'react';
import { Tabs, Badge } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import TraitWorkflow from './TraitWorkflow';
import { TraitType, TRAIT_DISPLAY_NAMES, TraitProgress } from '../types';
import { getTraitProgress } from '../services/api';

const { TabPane } = Tabs;

interface TraitTabsProps {
  npi: string;
  taskId: number;
  username: string;
  onTraitComplete?: (trait: TraitType) => void;
}

const ALL_TRAITS: TraitType[] = [
  'openness',
  'conscientiousness', 
  'extraversion',
  'agreeableness',
  'neuroticism'
];

const TraitTabs: React.FC<TraitTabsProps> = ({
  npi,
  taskId,
  username,
  onTraitComplete
}) => {
  const [activeTab, setActiveTab] = useState<TraitType>('openness');
  const [traitProgresses, setTraitProgresses] = useState<Record<TraitType, TraitProgress>>({} as Record<TraitType, TraitProgress>);
  const [loading, setLoading] = useState<boolean>(true);

  // 加载所有trait的进度
  useEffect(() => {
    const loadAllProgress = async () => {
      setLoading(true);
      try {
        const progressPromises = ALL_TRAITS.map(trait => 
          getTraitProgress(npi, taskId, trait, username).catch(error => {
            console.log(`Failed to load progress for ${trait}, using default:`, error);
            // 返回默认进度
            return {
              physician_id: parseInt(npi),
              task_id: taskId,
              evaluator: username,
              trait: trait,
              human_annotation_completed: false,
              machine_evaluation_completed: false,
              review_completed: false
            };
          })
        );
        const progresses = await Promise.all(progressPromises);
        
        const progressMap: Record<TraitType, TraitProgress> = {} as Record<TraitType, TraitProgress>;
        ALL_TRAITS.forEach((trait, index) => {
          progressMap[trait] = progresses[index];
        });
        
        setTraitProgresses(progressMap);
        
        // 找到第一个未完成的trait并激活
        const firstIncomplete = ALL_TRAITS.find(trait => 
          !progresses[ALL_TRAITS.indexOf(trait)]?.review_completed
        );
        if (firstIncomplete) {
          setActiveTab(firstIncomplete);
        }
      } catch (error) {
        console.error('Failed to load trait progress:', error);
        // 设置所有trait为默认进度
        const defaultProgressMap: Record<TraitType, TraitProgress> = {} as Record<TraitType, TraitProgress>;
        ALL_TRAITS.forEach(trait => {
          defaultProgressMap[trait] = {
            physician_id: parseInt(npi),
            task_id: taskId,
            evaluator: username,
            trait: trait,
            human_annotation_completed: false,
            machine_evaluation_completed: false,
            review_completed: false
          };
        });
        setTraitProgresses(defaultProgressMap);
      } finally {
        setLoading(false);
      }
    };

    loadAllProgress();
  }, [npi, taskId, username]);

  // 更新trait进度
  const updateTraitProgress = (trait: TraitType, progress: TraitProgress) => {
    setTraitProgresses(prev => ({
      ...prev,
      [trait]: progress
    }));
  };

  // trait完成回调
  const handleTraitComplete = (trait: TraitType) => {
    // 更新进度
    updateTraitProgress(trait, {
      ...traitProgresses[trait],
      review_completed: true
    });

    // 自动激活下一个未完成的trait
    const currentIndex = ALL_TRAITS.indexOf(trait);
    const nextTrait = ALL_TRAITS.slice(currentIndex + 1).find(t => 
      !traitProgresses[t]?.review_completed
    );
    
    if (nextTrait) {
      setActiveTab(nextTrait);
    }

    onTraitComplete?.(trait);
  };

  // 获取trait的完成状态
  const getTraitStatus = (trait: TraitType): 'completed' | 'in-progress' | 'pending' => {
    const progress = traitProgresses[trait];
    if (!progress) return 'pending';
    
    if (progress.review_completed) return 'completed';
    if (progress.human_annotation_completed || progress.machine_evaluation_completed) return 'in-progress';
    return 'pending';
  };

  // 渲染tab标题
  const renderTabTitle = (trait: TraitType) => {
    const status = getTraitStatus(trait);
    const displayName = TRAIT_DISPLAY_NAMES[trait];
    
    if (status === 'completed') {
      return (
        <span style={{ color: '#52c41a' }}>
          <CheckCircleOutlined style={{ marginRight: 4 }} />
          {displayName}
        </span>
      );
    }
    
    if (status === 'in-progress') {
      return (
        <Badge dot color="#1890ff">
          <span>{displayName}</span>
        </Badge>
      );
    }
    
    return displayName;
  };

  if (loading) {
    return <div>Loading trait progress...</div>;
  }

  return (
    <Tabs 
      activeKey={activeTab} 
      onChange={(key) => setActiveTab(key as TraitType)}
      type="card"
      size="large"
    >
      {ALL_TRAITS.map(trait => (
        <TabPane 
          tab={renderTabTitle(trait)} 
          key={trait}
          disabled={false} // 允许切换到任何tab
        >
          <TraitWorkflow
            npi={npi}
            taskId={taskId}
            username={username}
            trait={trait}
            progress={traitProgresses[trait]}
            onProgressUpdate={(progress: TraitProgress) => updateTraitProgress(trait, progress)}
            onComplete={() => handleTraitComplete(trait)}
          />
        </TabPane>
      ))}
    </Tabs>
  );
};

export default TraitTabs; 