# 医生人格特质标注系统

该系统用于标注医生的大五人格特质，并评估不同模型的标注结果。

## 项目结构

```
.
├── backend/             # Go后端
│   ├── controllers/     # 控制器
│   ├── models/          # 数据模型
│   ├── routes/          # API路由
│   ├── db/              # 数据库相关
│   └── main.go          # 入口文件
└── frontend/            # React前端
    ├── public/          # 静态资源
    └── src/             # 源代码
        ├── components/  # 组件
        ├── pages/       # 页面
        └── services/    # API服务
```

## 技术栈

- 后端：Go，Gin框架
- 前端：React，TypeScript，Ant Design组件库
- 数据库：PostgreSQL

## 本地开发

### 前提条件

- Node.js (v14+)
- Go (v1.16+)
- PostgreSQL

### 安装步骤

1. 克隆仓库：

```bash
git clone <repository-url>
cd phyreview_annotator
```

2. 初始化数据库：

```bash
psql -U postgres -f backend/db/init.sql
```

3. 设置后端：

```bash
cd backend
# 创建.env文件并配置数据库连接
go mod download
go run main.go
```

4. 设置前端：

```bash
cd frontend
npm install
npm start
```

5. 访问应用：

前端将在 http://localhost:3000 运行
后端API将在 http://localhost:8080/api 运行

## 系统功能

1. 标注者输入用户名、NPI号码和任务编号
2. 系统展示医生信息和患者评论
3. 标注者对医生的五大人格特质进行标注（开放性、尽责性、外向性、宜人性、神经质）
4. 提交标注后，系统展示各个模型的标注结果
5. 标注者对模型结果进行排序和评价

## API接口

### 获取医生信息

```
GET /api/physician/:npi
```

### 获取任务信息

```
GET /api/physician/:npi/task/:taskID?username=<username>
```

### 提交人类标注

```
POST /api/annotations
```

### 提交模型排名

```
POST /api/rankings
```

## 中文说明

### 系统概述

本系统是一个医生人格特质标注平台，主要用于：
1. 收集人类标注者对医生大五人格特质的评价
2. 展示不同LLM模型对同一医生的人格分析结果
3. 收集人类对不同模型输出结果的评价和排序

### 用户流程

1. **登录流程**：用户输入用户名、医生NPI号码和任务编号进入系统
2. **医生信息浏览**：系统展示医生基本信息和患者评论
3. **人类标注阶段**：用户对医生的五大人格特质进行评分和分析
4. **模型评价阶段**：用户查看多个模型的分析结果，进行排序和评价

### 技术实现

本系统采用前后端分离架构：
- 前端使用React+TypeScript开发，UI组件采用Ant Design
- 后端使用Go语言和Gin框架实现RESTful API
- 数据存储使用PostgreSQL关系型数据库 