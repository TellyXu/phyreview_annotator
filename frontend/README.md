# 前端应用

医生人格特质标注系统的前端应用，基于React和TypeScript开发。

## 技术栈

- **框架**: React 18
- **语言**: TypeScript
- **UI库**: Ant Design
- **状态管理**: React Hooks
- **路由**: React Router
- **HTTP客户端**: Axios
- **样式**: CSS + Ant Design主题

## 项目结构

```
frontend/
├── public/              # 静态资源
│   ├── index.html      # HTML模板
│   └── favicon.ico     # 网站图标
├── src/                # 源代码
│   ├── components/     # 可复用组件
│   │   ├── Login.tsx           # 登录组件
│   │   ├── PhysicianInfo.tsx   # 医生信息展示
│   │   ├── ReviewsList.tsx     # 评论列表
│   │   ├── TraitTabs.tsx       # 特质标签页
│   │   ├── TraitWorkflow.tsx   # 特质评估工作流
│   │   ├── HumanAnnotationForm.tsx    # 人工标注表单
│   │   ├── MachineEvaluationForm.tsx  # 机器评估表单
│   │   └── ReviewAndModifyForm.tsx    # 审查修改表单
│   ├── pages/          # 页面组件
│   │   ├── HomePage.tsx        # 首页
│   │   └── TaskPage.tsx        # 任务页面
│   ├── services/       # API服务
│   │   └── api.ts      # API接口封装
│   ├── types/          # TypeScript类型定义
│   │   └── index.ts    # 数据类型
│   ├── App.tsx         # 根组件
│   ├── App.css         # 全局样式
│   └── index.tsx       # 应用入口
├── package.json        # 项目依赖
└── tsconfig.json      # TypeScript配置
```

## 主要功能

### 1. 用户登录
- 用户名输入
- NPI号码和任务ID验证
- 会话管理

### 2. 医生信息展示
- 医生基本信息展示
- **HTML内容渲染**: 支持医生简介中的HTML标签显示
- **教育背景解析**: 自动解析`<education>`标签并格式化显示
- 响应式布局设计

### 3. 患者评论浏览
- 评论列表展示
- 评论元数据解析
- 滚动浏览功能

### 4. 人格特质标注
- 大五人格特质评估（开放性、尽责性、外向性、宜人性、神经质）
- 分数评定和一致性评估
- 证据文本输入

### 5. 机器学习模型评估
- 多模型结果展示
- 模型排序功能
- 评估反馈收集

## 快速开始

### 前提条件

- Node.js 14+
- npm 或 yarn

### 1. 安装依赖

```bash
cd frontend
npm install
```

### 2. 环境配置

创建 `.env` 文件（可选）：

```bash
REACT_APP_API_URL=http://localhost:8080/api
```

### 3. 启动开发服务器

```bash
npm start
```

应用将在 [http://localhost:3000](http://localhost:3000) 启动。

页面会在你编辑文件时自动重新加载。

## 可用脚本

### `npm start`
启动开发模式，在 [http://localhost:3000](http://localhost:3000) 查看应用。

### `npm test`
启动测试运行器。

### `npm run build`
构建生产版本到 `build` 文件夹。

### `npm run eject`
⚠️ **这是单向操作，无法撤销！**

## 特色功能

### HTML内容渲染
- 使用 `dangerouslySetInnerHTML` 安全渲染医生简介
- 自定义CSS样式美化HTML内容
- 支持段落、粗体、链接等HTML标签

### 教育背景解析
- 正则表达式解析 `<education>` 标签
- 列表格式展示教育经历
- 卡片式布局增强可读性

### 响应式设计
- 左右分栏布局（评论 + 标注界面）
- 自适应屏幕尺寸
- 移动端友好设计

### 用户体验优化
- 加载状态指示
- 错误处理和友好提示
- 进度跟踪和完成提示
- 数据持久化（sessionStorage）

## 组件说明

### 核心组件

- **Login**: 用户登录和身份验证
- **PhysicianInfo**: 医生信息展示，支持HTML渲染
- **ReviewsList**: 患者评论列表展示
- **TraitTabs**: 五大人格特质标签页导航
- **TraitWorkflow**: 单个特质的评估工作流

### 表单组件

- **HumanAnnotationForm**: 人工标注表单
- **MachineEvaluationForm**: 机器学习模型评估表单
- **ReviewAndModifyForm**: 标注审查和修改表单

## API集成

前端通过Axios与后端API通信：

```typescript
// 获取医生信息
const physician = await getPhysicianByNPI(npi);

// 提交人工标注
await submitTraitHumanAnnotation(npi, taskId, trait, annotation);

// 获取机器标注
const machineAnnotations = await getTraitMachineAnnotations(npi, taskId, trait);
```

## 样式定制

### Ant Design主题
项目使用Ant Design组件库，可以通过修改主题色彩来定制UI：

```css
/* App.css */
.physician-biography {
  line-height: 1.6;
}

.physician-biography p {
  margin-bottom: 12px;
  text-align: justify;
}
```

### 自定义样式
- 医生简介HTML内容样式
- 评论列表自定义滚动条
- 卡片阴影和间距优化

## 部署

### 构建生产版本

```bash
npm run build
```

构建文件将输出到 `build/` 目录。

### 部署选项

1. **静态文件服务器**: 将build目录内容部署到任何静态文件服务器
2. **Nginx**: 配置Nginx反向代理
3. **Vercel/Netlify**: 一键部署到云平台
4. **Docker**: 容器化部署

## 贡献指南

1. 遵循项目代码规范
2. 使用TypeScript类型安全
3. 组件应该是纯函数组件
4. 使用Ant Design组件保持一致性
5. 添加适当的错误处理

## 许可证

本项目采用 MIT 许可证。
