# 🌟 PipelineVisa Frontend

世界级B2B SaaS签证申请管理系统前端

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript 5.3
- **样式**: Tailwind CSS + CVA
- **状态管理**: TanStack Query + Zustand
- **表单**: React Hook Form + Zod
- **动画**: Framer Motion
- **实时通信**: Socket.io

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 运行生产服务器
npm start
```

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 认证页面组
│   ├── (consultant)/      # 顾问端页面组
│   └── (client)/          # 客户端页面组
├── components/            # 组件库
│   ├── ui/               # 基础UI组件
│   └── features/         # 业务组件
├── lib/                  # 核心库
├── services/            # API服务
├── stores/              # 状态管理
└── types/               # 类型定义
```

## 开发规范

### 代码风格
- 使用 ESLint + Prettier 统一代码风格
- 所有组件使用 TypeScript
- 遵循函数式编程原则

### 组件开发
- 使用 `cn()` 合并样式类
- 组件props使用interface定义
- 使用forwardRef处理ref传递

### Git提交规范
```
feat: 新功能
fix: 修复问题
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试相关
chore: 构建相关
```

## 设计规范

- **主色调**: 黑白极简
- **字体**: Inter + 苹方/微软雅黑
- **间距**: 8px基准网格
- **圆角**: 0.5rem标准圆角

## 环境变量

创建 `.env.local` 文件：

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 部署

### Vercel部署（推荐）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/pipelinevisa-frontend)

### Docker部署

```bash
docker build -t pipelinevisa-frontend .
docker run -p 3000:3000 pipelinevisa-frontend
```

## 性能优化

- 图片使用Next.js Image组件
- 路由预加载
- 代码分割
- API响应缓存
- 骨架屏加载

## 测试

```bash
# 单元测试
npm run test

# E2E测试
npm run test:e2e

# 测试覆盖率
npm run test:coverage
```

## License

Copyright © 2024 PipelineVisa. All rights reserved.