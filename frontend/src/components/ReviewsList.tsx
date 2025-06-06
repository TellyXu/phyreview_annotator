import React from 'react';
import { List, Card, Typography, Divider, Tag } from 'antd';
import { Review } from '../types';

const { Text } = Typography;

interface ReviewsListProps {
  reviews: Review[];
}

const ReviewsList: React.FC<ReviewsListProps> = ({ reviews }) => {
  // 格式化日期
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown Date';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US');
    } catch (e) {
      return dateString;
    }
  };

  // 解析元数据和评论内容
  const parseReviewMeta = (text: string) => {
    // 检查是否包含<meta>标签
    const metaMatch = text.match(/<meta>(.*?)<\/meta>/);
    if (metaMatch) {
      const meta = metaMatch[1];
      const content = text.replace(/<meta>.*?<\/meta>/, '').trim();
      return { meta, content };
    }
    
    return { meta: '', content: text };
  };

  return (
    <div style={{ 
      height: '100%',
      padding: 0,
      margin: 0
    }}>
      <List
        dataSource={reviews}
        size="small"
        split={false}
        style={{ 
          padding: 0,
          margin: 0
        }}
        renderItem={(review) => {
          const { meta, content } = parseReviewMeta(review.text);
          
          // 从meta中提取信息
          let source = '';
          
          // 尝试提取来源和日期
          if (meta) {
            const sourceMatch = meta.match(/- ([A-Za-z]+)$/);
            if (sourceMatch) {
              source = sourceMatch[1];
            }
          }
          
          return (
            <List.Item style={{ 
              marginBottom: 8,
              padding: 0,
              border: 'none'
            }}>
              <Card 
                type="inner" 
                size="small"
                title={
                  <div style={{ fontSize: '14px' }}>
                    <Text strong>Review #{review.review_index}</Text>
                    <Divider type="vertical" />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {formatDate(review.date)}
                    </Text>
                    {source && (
                      <>
                        <Divider type="vertical" />
                        <Tag color="blue">{source}</Tag>
                      </>
                    )}
                  </div>
                }
                style={{ 
                  width: '100%',
                  marginBottom: 0,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                }}
                bodyStyle={{
                  padding: '12px 16px',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}
                headStyle={{
                  padding: '8px 16px',
                  minHeight: 'auto',
                  fontSize: '14px'
                }}
              >
                <Text style={{ 
                  display: 'block',
                  lineHeight: '1.5',
                  color: '#333'
                }}>
                  {content}
                </Text>
              </Card>
            </List.Item>
          );
        }}
      />
    </div>
  );
};

export default ReviewsList; 