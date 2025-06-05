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
    <List
      dataSource={reviews}
      renderItem={(review) => {
        const { meta, content } = parseReviewMeta(review.text);
        
        // 从meta中提取信息
        let metaInfo = meta;
        let source = '';
        
        // 尝试提取来源和日期
        if (meta) {
          const sourceMatch = meta.match(/- ([A-Za-z]+)$/);
          if (sourceMatch) {
            source = sourceMatch[1];
          }
        }
        
        return (
          <List.Item style={{ marginBottom: 16 }}>
            <Card 
              type="inner" 
              title={
                <div>
                  <Text strong>Review #{review.review_index}</Text>
                  <Divider type="vertical" />
                  <Text type="secondary">{formatDate(review.date)}</Text>
                  {source && (
                    <>
                      <Divider type="vertical" />
                      <Tag color="blue">{source}</Tag>
                    </>
                  )}
                </div>
              }
              style={{ width: '100%' }}
            >
              <Text>{content}</Text>
            </Card>
          </List.Item>
        );
      }}
    />
  );
};

export default ReviewsList; 