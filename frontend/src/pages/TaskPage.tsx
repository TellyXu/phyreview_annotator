import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout, Typography, message, Spin, Button, Row, Col, Collapse } from 'antd';
import PhysicianInfo from '../components/PhysicianInfo';
import ReviewsList from '../components/ReviewsList';
import TraitTabs from '../components/TraitTabs';
import { getPhysicianByNPI, getPhysicianTask } from '../services/api';
import { Physician, Task, TraitType } from '../types';

const { Content } = Layout;
const { Title } = Typography;
const { Panel } = Collapse;

const TaskPage: React.FC = () => {
  const { npi, taskId } = useParams<{ npi: string; taskId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [physician, setPhysician] = useState<Physician | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [completedTraits, setCompletedTraits] = useState<Set<TraitType>>(new Set());
  const username = sessionStorage.getItem('username') || '';

  useEffect(() => {
    if (!username) {
      message.error('Please login first');
      navigate('/');
      return;
    }

    if (!npi || !taskId) {
      message.error('Invalid parameters');
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        // Get physician information
        const physicianData = await getPhysicianByNPI(npi);
        setPhysician(physicianData);

        // Get task information
        const taskData = await getPhysicianTask(npi, parseInt(taskId), username);
        setTask(taskData.task);

        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch data', error);
        message.error('Failed to fetch data, please try again later');
        setLoading(false);
      }
    };

    fetchData();
  }, [npi, taskId, username, navigate]);

  // Handle trait completion
  const handleTraitComplete = (trait: TraitType) => {
    setCompletedTraits(prev => new Set([...Array.from(prev), trait]));
    
    // Check if all traits are completed
    const allTraits: TraitType[] = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
    const newCompletedTraits = new Set([...Array.from(completedTraits), trait]);
    
    if (newCompletedTraits.size === allTraits.length) {
      message.success('🎉 Congratulations! You have completed all personality trait annotations!');
      
      // Delay redirect to home page
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } else {
      message.success(`✅ ${trait.charAt(0).toUpperCase() + trait.slice(1)} completed! ${allTraits.length - newCompletedTraits.size} traits remaining.`);
    }
  };

  // Handle logout
  const handleLogout = () => {
    sessionStorage.removeItem('username');
    navigate('/');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  if (!physician) {
    return (
      <div style={{ textAlign: 'center', marginTop: 100 }}>
        <Title level={3}>Physician information not found</Title>
        <Button type="primary" onClick={() => navigate('/')}>Return to Home</Button>
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={2}>Physician Personality Trait Annotation Task</Title>
          <div>
            <span style={{ marginRight: 16 }}>Current User: {username}</span>
            <span style={{ marginRight: 16, color: '#52c41a' }}>
              Completed: {completedTraits.size}/5 traits
            </span>
            <Button type="link" onClick={handleLogout}>Logout</Button>
          </div>
        </div>

        {/* Collapsible Physician Information */}
        <Collapse defaultActiveKey={[]} style={{ marginBottom: 24 }}>
          <Panel header="Physician Information" key="physician">
            <PhysicianInfo physician={physician} />
          </Panel>
        </Collapse>
        
        {/* Main Content - Left-Right Layout */}
        <Row gutter={24} style={{ height: 'calc(100vh - 200px)' }}>
          {/* Left Side - Patient Reviews (Fixed) */}
          <Col span={12}>
            <div style={{ 
              height: '100%', 
              overflowY: 'auto', 
              paddingRight: 8,
              border: '1px solid #f0f0f0',
              borderRadius: 6,
              padding: '16px 12px 16px 16px',
              backgroundColor: '#fafafa'
            }}>
              <Title level={3} style={{ 
                marginTop: 0, 
                position: 'sticky', 
                top: 0, 
                background: '#fafafa', 
                zIndex: 10, 
                paddingBottom: 12,
                marginBottom: 12,
                borderBottom: '1px solid #e8e8e8',
                fontSize: '18px'
              }}>
                患者评论 ({physician.reviews?.length || 0})
              </Title>
              <div style={{ 
                paddingRight: 4,
                height: 'calc(100% - 60px)',
                overflowY: 'auto',
                scrollbarWidth: 'thin',
                scrollbarColor: '#c1c1c1 transparent'
              }} className="reviews-container">
                {physician.reviews && <ReviewsList reviews={physician.reviews} />}
              </div>
            </div>
          </Col>
          
          {/* Right Side - Trait Tabs */}
          <Col span={12}>
            <div style={{ 
              height: '100%',
              overflowY: 'auto',
              paddingLeft: 8,
              border: '1px solid #f0f0f0',
              borderRadius: 6,
              padding: 16
            }}>
              {task && (
                <TraitTabs
                  npi={npi || ''}
                  taskId={task.id}
                  username={username}
                  onTraitComplete={handleTraitComplete}
                />
              )}
            </div>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default TaskPage; 