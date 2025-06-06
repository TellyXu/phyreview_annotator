import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = (values: { username: string; npi: string; task_id: string }) => {
    setLoading(true);
    
    // Store user information in session storage
    sessionStorage.setItem('username', values.username);
    
    // Delay to simulate network request
    setTimeout(() => {
      setLoading(false);
      
      // Navigate to task page
      navigate(`/task/${values.npi}/${values.task_id}`);
    }, 500);
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: '#f0f2f5'
    }}>
      <Card style={{ width: 400, boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
        <Title level={2} style={{ textAlign: 'center' }}>Physician Personality Trait Annotation</Title>
        <Form
          name="login"
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: 'Please enter your username!' }]}
          >
            <Input placeholder="Enter your username" />
          </Form.Item>

          <Form.Item
            label="NPI Number"
            name="npi"
            rules={[
              { required: true, message: 'Please enter NPI number!' },
              { pattern: /^\d+$/, message: 'NPI number must be numeric!' }
            ]}
          >
            <Input placeholder="Enter physician's NPI number" />
          </Form.Item>

          <Form.Item
            label="Task ID"
            name="task_id"
            rules={[
              { required: true, message: 'Please enter task ID!' },
              { pattern: /^\d+$/, message: 'Task ID must be numeric!' }
            ]}
          >
            <Input placeholder="Enter task ID" />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              style={{ width: '100%' }}
            >
              Start Annotation
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login; 