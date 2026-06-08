# RootsTrace 启动指南

三个服务按 **数据库 → 后端 → 前端** 顺序启动。

| 服务 | 目录 | 端口 | 一句话启动 |
|---|---|---|---|
| 数据库 PostgreSQL | （systemd 服务） | 5432 | `sudo systemctl start postgresql` |
| 后端 Spring Boot | `roots-trace-backend` | 8080 | `mvn spring-boot:run` |
| 前端 Vite + React | `roots-trace-frontend` | 5173 | `npm run dev` |

环境：Java 17、Maven 3.9、Node 22 / npm 10、Python venv（仅造数据用）。
打开 <http://localhost:5173> 即可访问，用已有账号登录（如 `ica` / `admin`）。

---

## 1. 数据库（PostgreSQL 16，端口 5432）

数据库以 systemd 服务方式运行，开机自启，平时不用手动管。

```bash
# 启动 / 停止 / 状态
sudo systemctl start postgresql
sudo systemctl stop postgresql
sudo systemctl status postgresql

# 连接（开发库）
PGPASSWORD=postgres psql -h localhost -U postgres -d genealogy
```

**连接参数**（与 `roots-trace-backend/src/main/resources/application-dev.yml` 一致）：

| 项 | 值 |
|---|---|
| Host | `localhost` |
| Port | `5432` |
| Database | `genealogy` |
| User | `postgres` |
| Password | `postgres` |

> 生产 profile (`application.yml`) 里密码占位是 `your_password`，部署时需替换。

### 重建测试数据（可选）

```bash
cd /home/hualuck7/RootsTrace
source venv/bin/activate
python scripts/data_generator.py
```

会 `TRUNCATE` 掉 `members / relations / families` 三张表后重新生成，**不动 `users`**，账号保留。生成内容（约 10 万成员）：

- **家族一「张氏宗谱」**：展示型小族，单一始祖、张姓血脉、约 12 代 / 600+ 人，用于族谱树全貌展示。
- **家族二 Family_2**：约 6 万人、近 20 代的大族，承载十万级数据量与递归查询性能演示（族谱树页面只展示前 10 代）。
- **家族 3–10**：各 3000–8000 人的随机族谱。

---

## 2. 后端（Spring Boot，端口 8080）

默认 profile 为 `dev`，直接连本地 `genealogy` 库，无需额外参数。

```bash
cd /home/hualuck7/RootsTrace/roots-trace-backend
mvn spring-boot:run
```

后台跑：

```bash
cd /home/hualuck7/RootsTrace/roots-trace-backend
nohup mvn spring-boot:run > /tmp/rootstrace-backend.log 2>&1 &
# 看日志
tail -f /tmp/rootstrace-backend.log
# 起来标志：日志出现 "Started GenealogyApplication"
```

停：

```bash
pkill -f 'spring-boot:run'
pkill -f 'com.genealogy.GenealogyApplication'
```

健康检查（接口前缀 `http://localhost:8080/api/...`）：

```bash
# 空请求体应返回 400（说明服务在线），未带 token 的受保护接口返回 401
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' -d '{}'
```

> 首次运行 / 依赖变更时 Maven 会联网拉依赖；离线可加 `-o`：`mvn -o spring-boot:run`。

---

## 3. 前端（Vite + React，端口 5173）

当前正式前端在 `roots-trace-frontend`（「墨与笺」设计）。

```bash
cd /home/hualuck7/RootsTrace/roots-trace-frontend
npm install      # 首次或依赖变更时
npm run dev
```

后台跑：

```bash
cd /home/hualuck7/RootsTrace/roots-trace-frontend
nohup npm run dev > /tmp/rootstrace-frontend.log 2>&1 &
```

停：

```bash
pkill -f vite
```

其它脚本：`npm run build`（产物到 `dist/`）、`npm run preview`（预览构建产物）。

> 前端通过 Vite 代理把 `/api` 转发到 `http://localhost:8080`，所以**必须先起后端**，否则登录等请求会失败。
> 若 5173 被占用，Vite 会自动改用 5174 等端口，以终端输出的实际地址为准。

打开 <http://localhost:5173>。

---

## 一键起全套（顺序执行）

```bash
# 1) 数据库
sudo systemctl start postgresql

# 2) 后端（后台）
cd /home/hualuck7/RootsTrace/roots-trace-backend
nohup mvn spring-boot:run > /tmp/rootstrace-backend.log 2>&1 &
# 等到日志出现 "Started GenealogyApplication" 再继续

# 3) 前端（后台）
cd /home/hualuck7/RootsTrace/roots-trace-frontend
nohup npm run dev > /tmp/rootstrace-frontend.log 2>&1 &
```

全部停掉：

```bash
pkill -f vite
pkill -f 'spring-boot:run'
pkill -f 'com.genealogy.GenealogyApplication'
# 数据库一般保持运行；如需停：sudo systemctl stop postgresql
```
