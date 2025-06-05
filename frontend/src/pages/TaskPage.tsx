import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout, Typography, Tabs, message, Spin, Button, Row, Col, Collapse } from 'antd';
import PhysicianInfo from '../components/PhysicianInfo';
import ReviewsList from '../components/ReviewsList';
import AnnotationForm from '../components/AnnotationForm';
import ModelEvaluationForm from '../components/ModelEvaluationForm';
import { getPhysicianByNPI, getPhysicianTask, submitHumanAnnotations, submitModelRanking } from '../services/api';
import { Physician, HumanAnnotation, ModelAnnotation, ModelRanking, Task } from '../types';

const { Content } = Layout;
const { Title } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;

const TaskPage: React.FC = () => {
  const { npi, taskId } = useParams<{ npi: string; taskId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [physician, setPhysician] = useState<Physician | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [modelAnnotations, setModelAnnotations] = useState<ModelAnnotation[]>([]);
  const [activeTab, setActiveTab] = useState<string>('annotation');
  const [submittedAnnotation, setSubmittedAnnotation] = useState<boolean>(false);
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
        setModelAnnotations(taskData.model_annotations);

        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch data', error);
        message.error('Failed to fetch data, please try again later');
        setLoading(false);
      }
    };

    fetchData();
  }, [npi, taskId, username, navigate]);

  // Handle human annotation submission
  const handleAnnotationSubmit = async (annotations: HumanAnnotation[]) => {
    try {
      setLoading(true);
      await submitHumanAnnotations(annotations);
      message.success('Annotation submitted successfully');
      setSubmittedAnnotation(true);
      setActiveTab('modelEvaluation');
      setLoading(false);
    } catch (error) {
      console.error('Failed to submit annotation', error);
      message.error('Failed to submit annotation, please try again later');
      setLoading(false);
    }
  };

  // Handle model ranking submission
  const handleRankingSubmit = async (ranking: ModelRanking) => {
    try {
      setLoading(true);
      await submitModelRanking(ranking);
      message.success('Evaluation submitted successfully');
      setLoading(false);
      
      // Delay redirect to home page
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Failed to submit evaluation', error);
      message.error('Failed to submit evaluation, please try again later');
      setLoading(false);
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
              padding: 16
            }}>
              <Title level={3} style={{ marginTop: 0, position: 'sticky', top: 0, background: 'white', zIndex: 10, paddingBottom: 16 }}>
                Patient Reviews ({physician.reviews?.length || 0})
              </Title>
              {physician.reviews && <ReviewsList reviews={physician.reviews} />}
            </div>
          </Col>
          
          {/* Right Side - Annotation/Evaluation Tabs */}
          <Col span={12}>
            <div style={{ 
              height: '100%',
              overflowY: 'auto',
              paddingLeft: 8,
              border: '1px solid #f0f0f0',
              borderRadius: 6,
              padding: 16
            }}>
              <Tabs 
                activeKey={activeTab} 
                onChange={setActiveTab}
                style={{ height: '100%' }}
                tabBarStyle={{ position: 'sticky', top: 0, background: 'white', zIndex: 10 }}
              >
                <TabPane tab="Human Annotation" key="annotation">
                  <div style={{ paddingTop: 16 }}>
                    {physician.id && task && (
                      <AnnotationForm 
                        physicianId={physician.id} 
                        taskId={task.id} 
                        username={username} 
                        onSubmit={handleAnnotationSubmit} 
                      />
                    )}
                  </div>
                </TabPane>
                
                <TabPane tab="Model Evaluation" key="modelEvaluation" disabled={!submittedAnnotation}>
                  <div style={{ paddingTop: 16 }}>
                    {physician.id && task && submittedAnnotation && (
                      <ModelEvaluationForm 
                        physicianId={physician.id} 
                        taskId={task.id} 
                        username={username} 
                        modelAnnotations={modelAnnotations} 
                        onSubmit={handleRankingSubmit} 
                      />
                    )}
                  </div>
                </TabPane>
              </Tabs>
            </div>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default TaskPage; 