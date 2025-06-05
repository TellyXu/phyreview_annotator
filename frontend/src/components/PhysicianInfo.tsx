import React from 'react';
import { Descriptions, Typography, Divider } from 'antd';
import { Physician } from '../types';

const { Title, Paragraph } = Typography;

interface PhysicianInfoProps {
  physician: Physician;
}

const PhysicianInfo: React.FC<PhysicianInfoProps> = ({ physician }) => {
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
      
      <Title level={4}>Physician Biography</Title>
      <Paragraph>
        {physician.biography_doc || 'No biography information available'}
      </Paragraph>
      
      <Divider />
      
      <Title level={4}>Education</Title>
      <Paragraph>
        {physician.education_doc || 'No education information available'}
      </Paragraph>
    </>
  );
};

export default PhysicianInfo; 