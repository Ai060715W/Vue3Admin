# vue3admin

## 简介
本项目是一个基于 Vue 3、Vite 2、Element Plus、TypeScript、Axios、Vue Router、Pinia、Fetch API 以及 Web Audio API 构建的后台电商管理系统。项目采用 pnpm 进行扁平化依赖管理，确保依赖的一致性和项目的稳定性。

后端部分使用 Node.js、Express、MySQL 构建 RESTful API，并集成 **DeepSeek 大模型**（通过 OpenAI 兼容 SDK）实现 AI 智能问答功能，支持流式响应、用户隔离与多轮对话，为系统提供强大的 AI 支持。

## 项目结构
```
Vue3Admin/
├── .vscode/                         # VS Code 编辑器配置
│   └── extensions.json              # 推荐扩展列表
├── apisever/                        # 后端 Express 服务
│   ├── config/
│   │   └── default.json             # 数据库 & JWT & DeepSeek 配置
│   ├── public/www/
│   │   └── default.png              # 默认图片资源
│   ├── router/
│   │   ├── express.js               # Express 实例 & 中间件（JWT、CORS）
│   │   └── index.js                 # 全部 API 路由（含 SSE 流式聊天）
│   ├── serve/                       # 业务逻辑模块
│   │   ├── Admin/admin.js           # 管理员操作（用户增删改）
│   │   ├── business/business.js     # 商家 CRUD
│   │   ├── chat/chat.js             # AI 聊天（DeepSeek + OpenAI SDK）
│   │   ├── file/file.js             # 文件上传处理
│   │   ├── login/login.js           # 登录认证（bcrypt + JWT）
│   │   ├── order/order.js           # 订单管理
│   │   ├── product/product.js       # 商品管理
│   │   ├── register/register.js     # 用户注册
│   │   └── Todo/todo.js             # 待办事项
│   ├── utils/mysql/
│   │   └── index.js                 # MySQL 连接池 & CRUD 封装
│   ├── index.js                     # 服务入口（端口 3000）
│   ├── package.json
│   └── pnpm-lock.yaml
├── public/                          # Vite 静态资源
│   ├── favicon.ico
│   └── img.png
├── src/                             # 前端源码
│   ├── assets/                      # 静态资源
│   │   ├── base.css
│   │   └── logo.svg
│   ├── components/                  # 公共组件
│   │   ├── ProductComponet.vue
│   │   └── icons/                   # SVG 图标组件
│   │       ├── IconCommunity.vue
│   │       ├── IconDocumentation.vue
│   │       ├── IconEcosystem.vue
│   │       ├── IconSupport.vue
│   │       └── IconTooling.vue
│   ├── Constants/
│   │   └── Cache-key.ts             # 缓存键常量
│   ├── directive/                   # 自定义指令
│   │   ├── index.ts
│   │   └── permission/
│   │       └── permission.ts        # 权限指令 v-permission
│   ├── router/
│   │   └── index.ts                 # Vue Router（常量路由 + 动态路由 + 守卫）
│   ├── serve/                       # 前端 API 调用层
│   │   ├── Admin/admin.ts           # 管理员接口
│   │   ├── Business/business.ts     # 商家接口
│   │   ├── chat/chat.ts             # 聊天接口（Fetch 流式请求）
│   │   ├── InfoGet/InfoGet.ts       # 通用查询接口
│   │   ├── login/login.ts           # 登录接口
│   │   ├── Order/order.ts           # 订单接口
│   │   ├── reigster/register.ts     # 注册接口
│   │   └── Todo/todo.ts             # 待办接口
│   ├── stores/                      # Pinia 状态管理
│   │   ├── index.ts
│   │   └── modules/
│   │       ├── permission.ts        # 权限 & 动态路由
│   │       └── users.ts             # 用户信息 & Token
│   ├── types/                       # TypeScript 类型定义
│   │   ├── Business.d.ts
│   │   ├── login.d.ts
│   │   ├── register.d.ts
│   │   └── vue-router.d.ts
│   ├── utils/                       # 工具函数
│   │   ├── rules.ts                 # 表单验证规则
│   │   ├── service.ts               # Axios 实例 & 拦截器
│   │   ├── toString.ts
│   │   ├── cache/
│   │   │   └── cookies.ts           # Token Cookie 管理
│   │   └── file/
│   │       ├── CreateChunk.js       # 大文件分片
│   │       ├── fileUpload.ts        # 文件上传逻辑
│   │       └── worker.js            # Web Worker
│   ├── views/                       # 页面视图
│   │   ├── login/login.vue          # 登录 / 注册页
│   │   ├── menu/menu.vue            # 首页（Hero + 入驻商家）
│   │   ├── mine/mine.vue            # 个人中心（多角色面板）
│   │   ├── Demo/
│   │   │   ├── audioVisualzationDemo.vue  # 音频可视化演示
│   │   │   └── chatDemo.vue               # AI 智能问答（左侧栏 + 对话区）
│   │   ├── Detail/
│   │   │   ├── BusinessDetail/businessDetail.vue  # 商家详情
│   │   │   └── BusinessList/businessList.vue      # 全部商家列表
│   │   └── Control/
│   │       ├── Control/control.vue        # 用户管理后台
│   │       ├── Control/userList.ts
│   │       ├── BusinessControl/BusinessControl.vue # 商家后台
│   │       └── FileControl/file.vue       # 文件管理
│   ├── App.vue                      # 根组件（全局导航栏）
│   └── main.ts                      # Vue 应用入口
├── 文档/                            # 项目文档
│   ├── 接口文档.md
│   ├── 后端配置文档.md
│   ├── 前端路由配置文档.md
│   ├── 前端自定义指令文档.md
│   ├── 前端Piania状态仓库文档.md
│   ├── 前端Util文档.md
│   ├── ai聊天接口文档.md
│   └── ai聊天配置文档.md
├── index.html                       # HTML 模板
├── vite.config.ts                   # Vite 构建配置
├── tsconfig.json                    # TypeScript 配置
├── tsconfig.app.json
├── tsconfig.node.json
├── env.d.ts                         # 环境类型声明
├── package.json                     # 前端依赖
├── pnpm-lock.yaml
└── pnpm-workspace.yaml
```

## 安装指南
### 前端依赖
```shell
cd Vue3Admin
pnpm install
```

### 后端依赖
```shell
cd Vue3Admin/apisever
pnpm install
```

### 数据库
1. 创建 MySQL 数据库 `vue3`
2. 修改 `apisever/config/default.json` 中的数据库连接信息
3. 项目首次启动时会自动建表

## 运行指南
### 前端（开发模式）
```shell
cd Vue3Admin
pnpm dev
```
访问 http://localhost:5173

### 后端
```shell
cd Vue3Admin/apisever
node index.js
```
服务运行在 http://localhost:3000

### 演示账号
| 账号 | 密码 | 角色 |
|------|------|------|
| admin | Admin@123 | 管理员 |
| zhangsan | Zhangsan@123 | 普通用户 |
| lisi | Lisi@123456 | 普通用户 |
| shangjia | Shangjia@123 | 商家 |

## 文档和资源
项目文档存放在根目录下的`文档`文件夹中，包括但不限于：
- **配置指南**：指导开发者如何参与项目开发。
- **API文档**：详细描述后端API接口。

## ## 技术栈详细说明

### 前端技术栈

#### Vue 3
- **版本**：3.x
- **描述**：Vue 3 是一个渐进式 JavaScript 框架，用于构建用户界面。它提供了响应式和组件化的特性，使得前端开发更加高效和可维护。
- **特点**：
  - 响应式数据绑定
  - 组件化开发
  - 组合式 API

#### Vite 2
- **版本**：2.x
- **描述**：Vite 是一个现代化的前端构建工具，它利用浏览器原生 ES 模块导入特性，提供了快速的冷启动和即时模块热更新。
- **特点**：
  - 快速的服务器启动
  - 热模块替换
  - 支持 TypeScript 和 JSX

#### Element Plus
- **版本**：1.x
- **描述**：Element Plus 是 Element UI 的 Vue 3 版本，提供了一系列高质量的 UI 组件，帮助开发者快速构建美观、易用的界面。
- **特点**：
  - 丰富的组件库
  - 遵循 Material Design 设计规范
  - 支持按需引入

#### TypeScript
- **版本**：4.x
- **描述**：TypeScript 是 JavaScript 的一个超集，它添加了类型系统和对 ES6+ 的支持，使得代码更加健壮和易于维护。
- **特点**：
  - 静态类型检查
  - 支持最新的 JavaScript 特性
  - 与 JavaScript 无缝集成

#### Axios
- **版本**：0.14.x
- **描述**：Axios 是一个基于 Promise 的 HTTP 客户端，用于在浏览器和 node.js 中进行 HTTP 请求。
- **特点**：
  - 从浏览器中创建 XMLHttpRequests
  - 从 node.js 发出 http 请求
  - 支持 Promise API

#### Vue Router
- **版本**：4.x
- **描述**：Vue Router 是 Vue.js 的官方路由管理器，用于构建单页面应用。
- **特点**：
  - 嵌套路由
  - 模块化、组件化的路由配置
  - 路由懒加载

#### Pinia
- **版本**：2.x
- **描述**：Pinia 是 Vue.js 的官方状态管理库，用于在 Vue 应用中管理共享状态。
- **特点**：
  - 简单轻量
  - 与 Vue 3 的组合式 API 紧密集成
  - 支持时间旅行调试

#### Fetch API
- **描述**：Fetch API 提供了一个 JavaScript 接口，用于访问和操纵 HTTP 管道，它提供了一个全局 fetch() 方法，用于异步请求资源。
- **特点**：
  - 基于 Promise 的接口
  - 可以替代 XMLHttpRequest
  - 支持请求和响应的流处理

#### Web Audio API
- **描述**：Web Audio API 是一个用于处理和合成音频的 Web 标准，它允许开发人员在网页中进行高级的音频操作。
- **特点**：
  - 强大的音频参数控制
  - 支持多种音频节点和路由
  - 可以进行实时音频效果处理

### 后端技术栈

#### Node.js
- **版本**：16.x 或更高
- **描述**：Node.js 是一个基于 Chrome V8 引擎的 JavaScript 运行环境，它允许开发者在服务器端运行 JavaScript 代码。
- **特点**：
  - 事件驱动、非阻塞 I/O 模型
  - 轻量级和高效
  - 拥有庞大的 npm 包生态系统

#### Express
- **版本**：4.x
- **描述**：Express 是一个灵活的 Node.js Web 应用框架，提供了一系列强大的功能，帮助开发者快速构建 Web 应用和 API。
- **特点**：
  - 极简且灵活
  - 提供了一系列强大的 HTTP 工具
  - 支持多种模板引擎

#### MySQL
- **版本**：8.x
- **描述**：MySQL 是一个流行的关系型数据库管理系统，用于存储和管理数据。
- **特点**：
  - 高性能、可靠性和易用性
  - 支持复杂的查询和事务处理
  - 拥有广泛的社区和工具支持

#### OpenAI SDK + DeepSeek
- **描述**：项目使用 OpenAI 兼容 SDK 接入 **DeepSeek** 大模型，实现 AI 智能问答功能。
- **特点**：
  - 兼容 OpenAI API 格式，无缝切换模型
  - 支持 SSE（Server-Sent Events）流式响应
  - 基于 JWT 的用户会话隔离
  - 多轮对话上下文记忆
  - 对话历史本地持久化（localStorage）
  - 支持新建/切换/搜索/删除对话

这些技术栈的选择旨在提供一个强大、灵活且易于维护的开发环境，以支持构建一个高效、可扩展的电商后台管理系统。

## 贡献指南
欢迎开发者为项目贡献代码。

## 许可证
本项目采用[MIT许可证](LICENSE)。

---
