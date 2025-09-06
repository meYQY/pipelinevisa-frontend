# PipelineVisa 前端紧急任务协同推进计划

## 📋 当前进度总览

### ✅ 已完成任务 (2/6)
1. **顾问诊断工作台页面** - AI批注显示、编辑、报告生成 ✅
2. **翻译对照界面** - 三栏布局、字段级复制功能 ✅

### 🚨 待分配任务 (5/7)
3. **客户补充材料页面** - 循环审核的客户端界面
4. **客户最终确认页面** - 客户确认翻译结果  
5. **状态机前端集成** - 状态同步和转换逻辑
6. **WebSocket实时功能** - 前端连接和数据同步
7. **质量检查和验收** - 端到端测试和代码审查

---

## 🎯 Claude协作任务分配

### Claude A (负责人) - 客户补充材料页面
**路径**: `/src/app/(client)/supplement/[token]/page.tsx`
**要求**:
- 显示顾问提出的问题列表
- 支持重新上传文件
- 实时进度显示
- 循环审核状态管理
- 与后端API真实对接

### Claude B - 客户最终确认页面  
**路径**: `/src/app/(client)/fill/[token]/review/page.tsx`
**要求**:
- 中英文对照确认界面
- 最终提交前的检查清单
- 数字签名或确认机制
- 完整的表单预览

### Claude C - 状态机前端集成
**路径**: `/src/stores/case-status.store.ts` + 相关组件更新
**要求**:
- 14个状态的前端状态机
- 状态转换验证逻辑
- 实时状态同步
- 权限控制集成

### Claude D - WebSocket实时功能
**路径**: `/src/lib/websocket.ts` + 相关组件集成  
**要求**:
- 实时数据同步
- 断线重连机制
- 多用户协作支持
- 性能优化

### Claude E - 质量检查和验收 🔍
**职责**: 端到端质量保证和系统集成测试
**要求**:
- **代码质量检查**: TypeScript类型检查、ESLint规范检查
- **功能完整性验证**: 确保每个页面都有真实API对接，无mock数据
- **业务流程测试**: 验证17步工作流程和14个状态转换正确性
- **UI/UX标准检查**: 确保达到Vercel/Supabase设计标准
- **性能和安全测试**: 大文件上传、并发访问、XSS防护测试
- **集成测试**: 验证各个Claude完成的模块能正确协作
- **生产就绪检查**: 确保代码可以直接部署到生产环境

---

## 🛠 技术标准和要求

### 代码质量要求 - 生产级标准
```typescript
// ✅ 必须: 完整类型定义
interface SupplementRequest {
  id: string
  case_id: string  
  consultant_feedback: string[]
  required_documents: RequiredDocument[]
  deadline: string
  status: 'pending' | 'in_progress' | 'completed'
}

// ✅ 必须: 真实API调用
const response = await supplementService.getSupplementRequest(token)

// ❌ 禁止: Mock数据
const mockData = { status: 'pending' }
```

### UI/UX设计要求 - Vercel标准
- 使用 `px-4` padding (16px) 实现最宽布局
- 现代化SaaS设计语言 (参考Vercel/Supabase)
- 完整的加载、错误、空状态设计
- 移动端响应式支持
- 微交互和状态反馈

### 业务逻辑要求 - 完整工作流
- 严格遵循17步业务流程
- 14个状态机状态正确转换
- 4个确认节点完整实现
- 循环审核机制支持

---

## 📁 关键文件和API参考

### 已完成参考文件
- `/src/app/(consultant)/cases/[id]/diagnosis/page.tsx` - 诊断工作台范例
- `/src/app/(consultant)/cases/[id]/translation/page.tsx` - 翻译界面范例
- `/src/services/diagnosis.service.ts` - 服务层范例
- `/src/services/translation.service.ts` - API集成范例

### 后端API接口 (已验证可用)
```typescript
// 客户补充材料API
GET /client/supplement/{token}  // 获取补充要求
POST /client/supplement/{token}/upload  // 上传文件
POST /client/supplement/{token}/submit  // 提交补充材料

// 状态管理API  
GET /cases/{id}/progress  // 获取17步进度
POST /cases/{id}/status   // 更新案例状态

// WebSocket端点
WS /ws/cases/{case_id}    // 实时数据同步
```

### 必需Service类
- `SupplementService` - 客户补充材料服务
- `CaseStatusService` - 状态管理服务  
- `WebSocketService` - 实时通信服务

---

## 🔗 协作同步机制

### 进度同步规则
1. **每完成一个主要功能**，更新本文档的完成状态
2. **遇到技术问题**，在下面的"问题记录"区域记录
3. **API接口变更**，及时更新API参考章节
4. **设计决策**，在"设计决策记录"中说明

### 代码提交规范
```bash
# 功能完成提交
git commit -m "feat: 完成客户补充材料页面 - 支持文件上传和循环审核"

# 修复问题提交  
git commit -m "fix: 修复WebSocket断线重连逻辑"

# TypeScript检查
npm run type-check  # 必须通过
```

---

## 📝 进度追踪区域

### 任务完成状态
- [ ] Claude A - 客户补充材料页面
- [ ] Claude B - 客户最终确认页面
- [ ] Claude C - 状态机前端集成
- [ ] Claude D - WebSocket实时功能

### 问题记录区域
```
问题1: [Claude X] - 描述问题
解决方案: 描述解决方案
状态: 已解决/待解决

问题2: ...
```

### 设计决策记录  
```
决策1: [日期] - 客户端状态管理使用React Context而非Redux
理由: 项目规模适中，Context足够且更轻量
影响: 所有状态相关组件需遵循此模式

决策2: ...
```

---

## 🚨 关键提醒

### 业务流程完整性
必须确保实现的功能能完整支持以下业务场景:
1. **循环审核**: 客户提交 → AI诊断 → 顾问审核 → 要求补充 → 客户补充 → 再次审核
2. **状态流转**: 14个状态按规则正确转换，不能跳跃
3. **权限控制**: 客户只能访问自己的页面，顾问只能访问分配的案例

### 生产级质量标准
- **零Mock数据**: 所有功能必须连接真实API
- **完整错误处理**: 网络错误、业务逻辑错误、权限错误
- **性能优化**: 大文件上传、实时数据同步优化
- **安全性**: 敏感数据加密、XSS防护、CSRF保护

### 验收标准
每个功能完成后必须能通过以下测试:
1. TypeScript编译无错误: `npm run type-check`
2. 端到端业务流程测试
3. 多用户并发测试 (WebSocket)
4. 移动端兼容性测试

---

## 📞 协作联系方式

如遇到以下情况，请在本文档相应区域记录:
- API接口问题 → "问题记录区域"  
- 设计方案冲突 → "设计决策记录"
- 进度阻塞 → "任务完成状态" 标注原因

**目标**: 在最短时间内完成所有4个紧急任务，确保PipelineVisa前端达到生产级标准！

---
*最后更新: 2024-01-15 14:30*
*负责人: Claude A (当前)*