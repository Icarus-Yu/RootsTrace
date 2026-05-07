# 寻根溯源 (RootsTrace) 项目第二阶段阶段性总结

## 📝 任务目标
在第一阶段完成基础框架、数据库设计和递归查询接口后，第二阶段开始补齐系统的认证和核心管理能力。本次阶段性目标是完成用户注册登录、JWT 登录态识别，以及族谱管理的基础入口，为后续成员管理、关系管理和前端页面接入打基础。

## 🏗️ 已完成工作

### 1. 用户与认证基础能力
- **用户实体映射**: 新增 `User` 实体和 `UserMapper`，对接数据库中已有的 `users` 表。
- **注册接口**: 实现 `POST /api/auth/register`，支持用户名、邮箱、密码注册，并校验用户名和邮箱重复。
- **登录接口**: 实现 `POST /api/auth/login`，支持用户名或邮箱登录。
- **密码安全**: 接入 `BCryptPasswordEncoder`，注册时密码哈希后入库，登录时使用 BCrypt 校验。
- **响应脱敏**: 新增 `UserVO`，接口返回用户信息时不暴露 `password` 字段。

### 2. JWT 登录态识别
- **Token 签发**: 登录成功后通过 `JwtUtil` 生成 JWT，包含 `userId` 和用户名主题信息。
- **JWT 过滤器**: 新增 `JwtAuthenticationFilter`，从 `Authorization: Bearer <token>` 请求头中解析并校验 token。
- **当前用户上下文**: 新增 `AuthUserPrincipal`，将当前用户的 `id`、`username`、`email` 放入 Spring Security 上下文。
- **当前用户接口**: 实现 `GET /api/auth/me`，用于根据 token 获取当前登录用户。
- **无状态认证配置**: 将 Spring Security 配置为 `STATELESS`，认证状态由 JWT 承载，不依赖服务端 Session。

### 3. 族谱管理基础入口
- **族谱实体映射**: 新增 `Family` 实体和 `FamilyMapper`，对接数据库中的 `families` 表。
- **创建族谱接口**: 实现 `POST /api/families`，创建时自动将 `ownerId` 设置为当前登录用户 ID。
- **族谱列表接口**: 实现 `GET /api/families`，查询当前登录用户创建且未软删除的族谱。
- **接口保护**: 将 `/api/families/**` 配置为需要登录，避免未认证用户创建或查看族谱。

### 4. 工程整理
- **占位文件清理**: 删除了已经有实际代码目录下的 `.gitkeep` 文件，保留仍为空目录中的占位文件。
- **编译验证**: 每次关键改动后均执行 Maven 编译检查，确认当前后端代码可以正常编译。

## 🔧 关键实现说明

### 1. 当前认证链路

```text
注册 / 登录
  -> 登录成功返回 JWT
  -> 前端请求携带 Authorization: Bearer token
  -> JwtAuthenticationFilter 校验 token
  -> SecurityContext 保存当前用户
  -> Controller 通过 Authentication 获取当前用户
```

### 2. 当前可用接口

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
GET  /api/families
POST /api/families
```

### 3. 当前请求示例

注册：

```json
{
  "username": "zhangsan",
  "email": "zhangsan@example.com",
  "password": "123456"
}
```

登录：

```json
{
  "account": "zhangsan",
  "password": "123456"
}
```

创建族谱：

```json
{
  "name": "张氏族谱",
  "surname": "张",
  "compiledAt": "2026-05-07"
}
```

## 🚦 当前状态
- **认证模块**: 已完成注册、登录、JWT 签发、JWT 校验和当前用户查询的基础闭环。
- **族谱模块**: 已完成实体、Mapper、创建族谱和当前用户族谱列表查询。
- **安全配置**: `/api/auth/me` 和 `/api/families/**` 已要求登录，其余旧接口暂时保持开放，避免影响第一阶段查询功能。
- **前端**: 尚未接入这些新接口，后续需要在 Axios 拦截器中统一携带 token。

## 📅 下一步计划
1. **完善族谱管理**: 补充 `GET /api/families/{id}`、`PUT /api/families/{id}`、`DELETE /api/families/{id}`，实现详情、编辑和软删除。
2. **补充权限校验**: 族谱详情、编辑、删除必须校验当前用户是 `owner` 或协作者。
3. **成员管理升级**: 将成员新增、列表、编辑、删除接口与族谱权限关联，避免跨用户访问。
4. **关系管理接口**: 实现新增关系、删除关系、同族谱校验和防环校验。
5. **前端接入**: 实现登录、注册、族谱列表和创建族谱页面，打通真实认证流程。
