# 医生人格特质标注系统

该系统用于标注医生的大五人格特质，并评估不同模型的标注结果。支持HTML内容渲染、教育背景解析等先进功能。

## 🌟 主要特色

- ✅ **HTML内容渲染**: 完美显示医生简介中的HTML标签内容
- ✅ **教育背景解析**: 自动解析`<education>`标签并格式化展示
- ✅ **响应式设计**: 左右分栏布局，适配各种屏幕尺寸
- ✅ **实时进度跟踪**: 5大人格特质完成状态实时显示
- ✅ **多模型评估**: 支持多个AI模型结果对比和评估
- ✅ **用户体验优化**: 友好的界面和交互设计

## 项目结构

```
.
├── backend/             # Go后端 API 服务
│   ├── cmd/             # 命令行工具
│   │   └── import/      # 数据导入工具
│   ├── controllers/     # API控制器
│   │   └── physician.go # 医生相关API
│   ├── models/          # 数据模型
│   │   └── models.go    # 数据结构定义
│   ├── routes/          # API路由
│   │   └── routes.go    # 路由配置
│   ├── db/              # 数据库相关
│   │   ├── database.go  # 数据库连接
│   │   └── *.sql        # SQL脚本
│   └── main.go          # 应用入口
├── frontend/            # React前端应用
│   ├── public/          # 静态资源
│   └── src/             # 源代码
│       ├── components/  # 组件库
│       │   ├── Login.tsx               # 登录组件
│       │   ├── PhysicianInfo.tsx       # 医生信息展示(支持HTML渲染)
│       │   ├── ReviewsList.tsx         # 评论列表
│       │   ├── TraitTabs.tsx           # 特质标签页
│       │   ├── TraitWorkflow.tsx       # 特质评估工作流
│       │   ├── HumanAnnotationForm.tsx # 人工标注表单
│       │   ├── MachineEvaluationForm.tsx # 机器评估表单
│       │   └── ReviewAndModifyForm.tsx # 审查修改表单
│       ├── pages/       # 页面组件
│       │   ├── HomePage.tsx    # 首页
│       │   └── TaskPage.tsx    # 任务页面
│       └── services/    # API服务
└── database/            # 数据库文档
    ├── README.md        # 数据库结构文档
    ├── first_10_phy_records.json # 示例数据
    └── etl.py          # 数据处理脚本
```

## 技术栈

### 后端
- **语言**: Go 1.16+
- **框架**: Gin Web Framework
- **数据库**: PostgreSQL
- **特性**: RESTful API, CORS支持, 原生SQL查询

### 前端
- **框架**: React 18 + TypeScript
- **UI库**: Ant Design
- **状态管理**: React Hooks
- **路由**: React Router
- **HTTP客户端**: Axios

### 数据库
- **主数据库**: PostgreSQL
- **表结构**: physicians, reviews, tasks, human_annotations, model_annotations

## 快速开始

### 📋 前提条件

- Node.js (v14+)
- Go (v1.16+)
- PostgreSQL (v12+)

### 🚀 安装和运行

#### 1. 克隆仓库

```bash
git clone https://github.com/TellyXu/phyreview_annotator.git
cd phyreview_annotator
```

#### 2. 数据库设置

```bash
# 创建数据库
createdb physicians

# 运行初始化脚本（如果有）
psql -d physicians -f backend/db/init.sql
```

#### 3. 启动后端服务

```bash
cd backend

# 设置环境变量
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=your_username
export DB_PASSWORD=your_password
export DB_NAME=physicians
export DB_SSLMODE=disable

# 安装依赖并运行
go mod download
go run main.go
```

后端API将在 `http://localhost:8080` 启动。

#### 4. 启动前端应用

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm start
```

前端应用将在 `http://localhost:3000` 启动。

### 🎯 使用方法

1. **登录系统**: 输入用户名、医生NPI号码和任务编号
2. **查看医生信息**: 浏览医生简介（支持HTML格式）和教育背景
3. **阅读患者评论**: 在左侧面板滚动查看所有患者评论
4. **进行人格标注**: 对五大人格特质进行评分和分析
5. **评估AI模型**: 查看和评估多个AI模型的分析结果
6. **完成任务**: 完成所有5个特质的标注

## 🆕 最新功能

### HTML内容渲染
- 医生简介支持完整的HTML标签显示
- 自动清理不安全的脚本内容
- 美观的CSS样式优化

### 教育背景解析
- 智能解析`<education>`XML标签
- 格式化显示为编号列表
- 卡片式布局增强可读性

### 用户体验提升
- 实时进度显示 (已完成 X/5 特质)
- 完成所有任务后的庆祝提示
- 3秒后自动返回首页

### 工作流优化
- 新增TraitWorkflow组件统一管理流程
- 支持标注历史查看和修改
- 机器学习模型结果对比评估

## API 接口

### 医生信息
- `GET /api/physician/:npi` - 获取医生详细信息
- `GET /api/physician/:npi/task/:taskID` - 获取任务信息

### 人格特质标注
- `POST /api/physician/:npi/task/:taskID/trait/:trait/human-annotation` - 提交人工标注
- `GET /api/physician/:npi/task/:taskID/trait/:trait/machine-annotations` - 获取机器标注
- `POST /api/physician/:npi/task/:taskID/trait/:trait/machine-evaluation` - 提交机器评估
- `GET /api/physician/:npi/task/:taskID/trait/:trait/progress` - 获取进度
- `GET /api/physician/:npi/task/:taskID/trait/:trait/history` - 获取历史记录
- `POST /api/physician/:npi/task/:taskID/trait/:trait/complete` - 完成特质评估

## 系统功能

### 🔐 用户认证
- 会话管理 (sessionStorage)
- 用户名和任务验证
- 自动登出功能

### 👨‍⚕️ 医生信息展示
- 基本信息展示
- **HTML简介渲染**: 支持`<p>`, `<b>`, `<a>`等标签
- **教育背景格式化**: 解析XML标签为结构化列表
- 折叠式面板节省空间

### 💬 患者评论系统
- 评论列表展示
- 元数据解析 (来源、日期等)
- 自定义滚动条美化

### 🧠 人格特质评估
- **五大人格维度**: 
  - 开放性 (Openness)
  - 尽责性 (Conscientiousness) 
  - 外向性 (Extraversion)
  - 宜人性 (Agreeableness)
  - 神经质 (Neuroticism)
- 评分系统 (Low/Moderate/High)
- 一致性和充分性评估
- 证据文本记录

### 🤖 AI模型评估
- 多模型结果对比
- 模型排序功能
- 准确性评价
- 主观评论收集

### 📊 进度跟踪
- 实时显示完成进度 (X/5 traits)
- 特质完成状态指示
- 自动保存和恢复

## 数据库结构

详细的数据库结构说明请参考 [database/README.md](./database/README.md)。

主要表包括：
- `physicians` - 医生信息表
- `reviews` - 患者评论表  
- `tasks` - 标注任务表
- `human_annotations` - 人工标注结果表
- `model_annotations` - AI模型标注表
- `machine_annotation_evaluations` - 模型评估表

## 部署指南

### 开发环境
参考上述"快速开始"部分。

### 生产环境

#### 后端部署
```bash
# 构建
go build -o phyreview-api main.go

# 运行
./phyreview-api
```

#### 前端部署
```bash
# 构建
npm run build

# 部署到静态文件服务器
cp -r build/* /var/www/html/
```

#### Docker部署
项目支持Docker容器化部署，具体配置请参考各子目录的README。

## 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范
- 后端遵循Go语言标准
- 前端使用TypeScript严格模式
- 使用Ant Design组件保持UI一致性
- 添加适当的错误处理和日志

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 更新日志

### v1.2.0 (最新)
- ✅ 新增HTML内容渲染功能
- ✅ 教育背景自动解析和格式化
- ✅ 优化用户界面和体验
- ✅ 完善API文档和错误处理

### v1.1.0
- ✅ 实现完整的人格特质标注工作流
- ✅ 添加机器学习模型评估功能
- ✅ 优化数据库结构

### v1.0.0
- ✅ 基础系统框架
- ✅ 用户登录和医生信息展示
- ✅ 患者评论浏览

## 联系方式

如有问题或建议，请通过以下方式联系：

- 📧 Email: [xutelly@gmail.com](mailto:xutelly@gmail.com)
- 🐛 Issues: [GitHub Issues](https://github.com/TellyXu/phyreview_annotator/issues)
- 📚 Wiki: [项目文档](https://github.com/TellyXu/phyreview_annotator/wiki)

---

⭐ 如果这个项目对你有帮助，请给我们一个星标！ 