import React, { useState, useEffect } from 'react';
import { Tabs, Card, Button, message } from 'antd';
import { getTraitProgress } from '../services/api';
import TraitWorkflow from './TraitWorkflow';
import { TraitType, TraitProgress, TRAIT_DISPLAY_NAMES } from '../types';

const { TabPane } = Tabs;

// 调试日志函数
const logDebug = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[TABS ${timestamp}] ${message}`;
  console.log(formattedMessage);
  if (data) {
    console.log('Data:', data);
  }
  // 存储最近的日志
  const logs = JSON.parse(sessionStorage.getItem('debug_logs') || '[]');
  logs.push({ time: timestamp, message, data: data ? JSON.stringify(data) : undefined });
  if (logs.length > 30) logs.shift();
  sessionStorage.setItem('debug_logs', JSON.stringify(logs));
};

interface TraitTabsProps {
  npi: string;
  taskId: number;
  username: string;
  onTraitComplete: (trait: TraitType) => void;
}

const TraitTabs: React.FC<TraitTabsProps> = ({
  npi,
  taskId,
  username,
  onTraitComplete
}) => {
  const [activeKey, setActiveKey] = useState<TraitType>('openness');
  const [progress, setProgress] = useState<Record<TraitType, TraitProgress | null>>({
    openness: null,
    conscientiousness: null,
    extraversion: null,
    agreeableness: null,
    neuroticism: null
  });
  const [loading, setLoading] = useState(true);
  const [emergencyFix, setEmergencyFix] = useState(false);

  // 加载进度数据
  useEffect(() => {
    const loadProgress = async () => {
      setLoading(true);
      const traits: TraitType[] = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
      
      for (const trait of traits) {
        try {
          // 首先尝试从sessionStorage恢复进度
          const storedProgressKey = `progress_${npi}_${taskId}_${trait}`;
          const storedProgress = sessionStorage.getItem(storedProgressKey);
          
          if (storedProgress) {
            logDebug(`从SessionStorage恢复${trait}进度`, JSON.parse(storedProgress));
            setProgress(prev => ({
              ...prev,
              [trait]: JSON.parse(storedProgress)
            }));
          }
          
          // 然后从API获取最新进度
          const traitProgress = await getTraitProgress(npi, taskId, trait, username);
          logDebug(`从API获取${trait}进度`, traitProgress);
          
          // 修正可能的错误进度数据
          // 如果本地存储的进度比API返回的进度更高级，使用本地进度
          if (storedProgress) {
            const parsedStored = JSON.parse(storedProgress) as TraitProgress;
            
            // 检查是否需要修正进度
            const needsFixing = 
              (parsedStored.human_annotation_completed && !traitProgress.human_annotation_completed) ||
              (parsedStored.machine_evaluation_completed && !traitProgress.machine_evaluation_completed) ||
              (parsedStored.review_completed && !traitProgress.review_completed);
              
            if (needsFixing) {
              logDebug(`检测到${trait}进度不一致，使用本地存储的更高级进度`, {
                api: traitProgress,
                local: parsedStored
              });
              setProgress(prev => ({
                ...prev,
                [trait]: parsedStored
              }));
              // 标记已应用应急修复
              setEmergencyFix(true);
            } else {
              setProgress(prev => ({
                ...prev,
                [trait]: traitProgress
              }));
            }
          } else {
            setProgress(prev => ({
              ...prev,
              [trait]: traitProgress
            }));
          }
        } catch (error) {
          console.error(`Failed to load progress for ${trait}:`, error);
          // 如果API调用失败，尝试从localStorage恢复备份
          const backupProgress = localStorage.getItem(`progress_backup_${npi}_${taskId}_${trait}`);
          if (backupProgress) {
            logDebug(`API调用失败，从备份恢复${trait}进度`, JSON.parse(backupProgress));
            setProgress(prev => ({
              ...prev,
              [trait]: JSON.parse(backupProgress)
            }));
            // 标记已应用应急修复
            setEmergencyFix(true);
          }
        }
      }
      setLoading(false);
    };

    loadProgress();
  }, [npi, taskId, username]);

  // 处理Tab切换
  const handleTabChange = (key: string) => {
    setActiveKey(key as TraitType);
  };

  // 处理进度更新
  const handleProgressUpdate = (trait: TraitType, updatedProgress: TraitProgress) => {
    logDebug(`更新${trait}进度`, updatedProgress);
    setProgress(prev => ({
      ...prev,
      [trait]: updatedProgress
    }));
  };

  // 处理trait完成
  const handleTraitComplete = (trait: TraitType) => {
    logDebug(`${trait}完成`);
    onTraitComplete(trait);
  };
  
  // 自动修复功能
  const autoFix = () => {
    logDebug('应用自动修复');
    const traits: TraitType[] = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
    
    traits.forEach(trait => {
      // 从localStorage获取阶段备份
      const stageBackup = localStorage.getItem(`stage_backup_${npi}_${taskId}_${trait}`);
      const progressBackup = localStorage.getItem(`progress_backup_${npi}_${taskId}_${trait}`);
      
      if (stageBackup && progressBackup) {
        logDebug(`恢复${trait}备份数据`, {stage: stageBackup, progress: JSON.parse(progressBackup)});
        // 写入sessionStorage
        sessionStorage.setItem(`stage_${npi}_${taskId}_${trait}`, stageBackup);
        sessionStorage.setItem(`progress_${npi}_${taskId}_${trait}`, progressBackup);
        
        // 更新状态
        if (trait === activeKey && progressBackup) {
          setProgress(prev => ({
            ...prev,
            [trait]: JSON.parse(progressBackup)
          }));
        }
      }
    });
    
    message.success('已应用紧急修复，请刷新页面');
    setEmergencyFix(false);
    
    // 延迟刷新页面
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  return (
    <Card 
      title="Personality Trait Assessment"
      extra={
        emergencyFix && (
          <Button type="primary" danger size="small" onClick={autoFix}>
            修复状态错误
          </Button>
        )
      }
    >
      <Tabs activeKey={activeKey} onChange={handleTabChange}>
        <TabPane tab={TRAIT_DISPLAY_NAMES['openness']} key="openness">
          <TraitWorkflow
            npi={npi}
            taskId={taskId}
            username={username}
            trait="openness"
            progress={progress.openness || {
              physician_id: parseInt(npi),
              task_id: taskId,
              evaluator: username,
              trait: 'openness',
              human_annotation_completed: false,
              machine_evaluation_completed: false,
              review_completed: false
            }}
            onProgressUpdate={(updatedProgress) => handleProgressUpdate('openness', updatedProgress)}
            onComplete={() => handleTraitComplete('openness')}
          />
        </TabPane>
        <TabPane tab={TRAIT_DISPLAY_NAMES['conscientiousness']} key="conscientiousness">
          <TraitWorkflow
            npi={npi}
            taskId={taskId}
            username={username}
            trait="conscientiousness"
            progress={progress.conscientiousness || {
              physician_id: parseInt(npi),
              task_id: taskId,
              evaluator: username,
              trait: 'conscientiousness',
              human_annotation_completed: false,
              machine_evaluation_completed: false,
              review_completed: false
            }}
            onProgressUpdate={(updatedProgress) => handleProgressUpdate('conscientiousness', updatedProgress)}
            onComplete={() => handleTraitComplete('conscientiousness')}
          />
        </TabPane>
        <TabPane tab={TRAIT_DISPLAY_NAMES['extraversion']} key="extraversion">
          <TraitWorkflow
            npi={npi}
            taskId={taskId}
            username={username}
            trait="extraversion"
            progress={progress.extraversion || {
              physician_id: parseInt(npi),
              task_id: taskId,
              evaluator: username,
              trait: 'extraversion',
              human_annotation_completed: false,
              machine_evaluation_completed: false,
              review_completed: false
            }}
            onProgressUpdate={(updatedProgress) => handleProgressUpdate('extraversion', updatedProgress)}
            onComplete={() => handleTraitComplete('extraversion')}
          />
        </TabPane>
        <TabPane tab={TRAIT_DISPLAY_NAMES['agreeableness']} key="agreeableness">
          <TraitWorkflow
            npi={npi}
            taskId={taskId}
            username={username}
            trait="agreeableness"
            progress={progress.agreeableness || {
              physician_id: parseInt(npi),
              task_id: taskId,
              evaluator: username,
              trait: 'agreeableness',
              human_annotation_completed: false,
              machine_evaluation_completed: false,
              review_completed: false
            }}
            onProgressUpdate={(updatedProgress) => handleProgressUpdate('agreeableness', updatedProgress)}
            onComplete={() => handleTraitComplete('agreeableness')}
          />
        </TabPane>
        <TabPane tab={TRAIT_DISPLAY_NAMES['neuroticism']} key="neuroticism">
          <TraitWorkflow
            npi={npi}
            taskId={taskId}
            username={username}
            trait="neuroticism"
            progress={progress.neuroticism || {
              physician_id: parseInt(npi),
              task_id: taskId,
              evaluator: username,
              trait: 'neuroticism',
              human_annotation_completed: false,
              machine_evaluation_completed: false,
              review_completed: false
            }}
            onProgressUpdate={(updatedProgress) => handleProgressUpdate('neuroticism', updatedProgress)}
            onComplete={() => handleTraitComplete('neuroticism')}
          />
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default TraitTabs; 