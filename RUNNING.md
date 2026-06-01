# RootsTrace 启动指南

三个服务按 **数据库 → 后端 → 前端** 顺序启动。

## 1. 数据库（PostgreSQL 16）

数据库以 systemd 服务方式运行，机器开机自动起来，平时不用手动管。

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

> 生产 profile (`application.yml`) 里密码占位是 `your_password`，需替换。

### 重建测试数据

```bash
cd /home/hualuck7/RootsTrace
source venv/bin/activate
python scripts/data_generator.py
```

会 `TRUNCATE` 掉 `members / relations / families` 三张表后重新生成，不会动 `users`，账号保留。

## 2. 后端（Spring Boot，端口 8080）

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
# 看是否起来：日志里出现 "Started GenealogyApplication"
```

停：

```bash
pkill -f 'spring-boot:run'
pkill -f 'com.genealogy.GenealogyApplication'
```

接口前缀：`http://localhost:8080/api/...`

## 3. 前端（Vite + React，端口 5173）

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
pkill -f 'vite'
```

打开 <http://localhost:5173>。
