import React from 'react';
import { Descriptions, Typography, Divider, List } from 'antd';
import { Physician } from '../types';

const { Title, Paragraph } = Typography;

interface PhysicianInfoProps {
  physician: Physician;
}

const PhysicianInfo: React.FC<PhysicianInfoProps> = ({ physician }) => {
  // 解析教育信息，将<education>标签转换为列表项
  const parseEducation = (educationText: string) => {
    if (!educationText) return [];
    
    // 使用正则表达式匹配<education>标签
    const educationRegex = /<education>(.*?)<\/education>/g;
    const educationItems: string[] = [];
    let match;
    
    while ((match = educationRegex.exec(educationText)) !== null) {
      educationItems.push(match[1]);
    }
    
    return educationItems;
  };

  // 清理HTML内容，移除一些不安全的标签
  const sanitizeHTML = (html: string) => {
    if (!html) return '';
    
    // 移除script和style标签
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  };

  const educationItems = parseEducation(physician.education_doc);

  return (
    <>
      <Title level={3}>{physician.doc_name}</Title>
      <Descriptions bordered column={2}>
        <Descriptions.Item label="PhyID">{physician.phy_id}</Descriptions.Item>
        <Descriptions.Item label="NPI">{physician.npi}</Descriptions.Item>
        <Descriptions.Item label="FirstName">{physician.first_name}</Descriptions.Item>
        <Descriptions.Item label="LastName">{physician.last_name}</Descriptions.Item>
        <Descriptions.Item label="Gender">{physician.gender}</Descriptions.Item>
        <Descriptions.Item label="Credential">{physician.credential}</Descriptions.Item>
        <Descriptions.Item label="Specialty">{physician.specialty}</Descriptions.Item>
        <Descriptions.Item label="PracticeZip5">{physician.practice_zip5}</Descriptions.Item>
        <Descriptions.Item label="BusinessZip5">{physician.business_zip5}</Descriptions.Item>
        <Descriptions.Item label="NumberOfReviews">{physician.num_reviews}</Descriptions.Item>
        <Descriptions.Item label="DocName">{physician.doc_name}</Descriptions.Item>
        <Descriptions.Item label="Zip3">{physician.zip3}</Descriptions.Item>
        <Descriptions.Item label="Zip2">{physician.zip2}</Descriptions.Item>
        <Descriptions.Item label="Zipcode">{physician.zipcode}</Descriptions.Item>
        <Descriptions.Item label="State">{physician.state}</Descriptions.Item>
        <Descriptions.Item label="Region">{physician.region}</Descriptions.Item>
      </Descriptions>
      
      <Divider />
      
      <Title level={4}>医生简介</Title>
      <div style={{ 
        lineHeight: '1.6', 
        color: '#333',
        background: '#fafafa',
        padding: '16px',
        borderRadius: '6px',
        border: '1px solid #f0f0f0'
      }}>
        {physician.biography_doc ? (
          <div 
            className="physician-biography"
            dangerouslySetInnerHTML={{ 
              __html: sanitizeHTML(physician.biography_doc) 
            }}
          />
        ) : (
          <Paragraph type="secondary">暂无简介信息</Paragraph>
        )}
      </div>
      
      <Divider />
      
      <Title level={4}>教育背景</Title>
      <div style={{ 
        background: '#fafafa',
        padding: '16px',
        borderRadius: '6px',
        border: '1px solid #f0f0f0'
      }}>
        {educationItems.length > 0 ? (
          <List
            dataSource={educationItems}
            renderItem={(item, index) => (
              <List.Item style={{ border: 'none', padding: '8px 0' }}>
                <div style={{ 
                  background: '#fff',
                  padding: '12px 16px',
                  borderRadius: '4px',
                  border: '1px solid #e8e8e8',
                  width: '100%'
                }}>
                  <Typography.Text>
                    <strong>{index + 1}.</strong> {item}
                  </Typography.Text>
                </div>
              </List.Item>
            )}
          />
        ) : (
          <Paragraph type="secondary">暂无教育背景信息</Paragraph>
        )}
      </div>
    </>
  );
};

export default PhysicianInfo; 