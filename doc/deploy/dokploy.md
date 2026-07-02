# 云合 CRM Dokploy 部署

## 目标

- 访问域名：`https://crm.yhi.cn`
- 部署平台：上海服务器 `150.158.86.118` 上的 Dokploy
- 前端服务：本仓库 Dockerfile 构建出的 Nginx 静态服务
- 后端服务：Supabase 项目，负责数据库、Auth、Storage、Edge Functions

## 域名解析

在 DNS 服务商添加记录：

```text
crm.yhi.cn  A  150.158.86.118
```

解析生效后，在 Dokploy 应用域名中添加 `crm.yhi.cn`，开启 HTTPS 证书。

## Supabase

创建或选择一个 Supabase 项目后，执行：

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
npx supabase functions deploy
```

在 Supabase Auth URL 配置中设置：

```text
Site URL: https://crm.yhi.cn
Redirect URLs:
https://crm.yhi.cn/auth-callback.html
```

如需邮件邀请和找回密码，配置 SMTP。未配置 SMTP 时，管理员账号使用本地脚本创建。

## Dokploy 应用

在 Dokploy 中创建应用：

- Project：`yunhe`
- Application：`yunhe-crm`
- Application ID：`2YxXWjXsPLgG4zvue7U75`
- Source：GitHub 仓库
- Build Type：Dockerfile
- Dockerfile Path：`Dockerfile`
- Container Port：`80`
- Domain：`crm.yhi.cn`

构建参数设置：

```text
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SB_PUBLISHABLE_KEY=sb_publishable_<replace-me>
VITE_IS_DEMO=false
VITE_ATTACHMENTS_BUCKET=attachments
VITE_INBOUND_EMAIL=
VITE_GOOGLE_WORKPLACE_DOMAIN=
VITE_DISABLE_EMAIL_PASSWORD_AUTHENTICATION=false
```

Vite 环境变量在构建时写入前端产物。修改 Supabase URL 或 publishable key 后，需要重新构建部署。

也可以在本机通过 CLI 写入 Dokploy 构建参数：

```bash
set -a
source .env.production
set +a
npm run crm:dokploy-configure
dokploy application deploy --applicationId 2YxXWjXsPLgG4zvue7U75
```

`SUPABASE_SERVICE_ROLE_KEY` 和 `CRM_ADMIN_PASSWORD` 只供管理员账号脚本使用，不写入 Dokploy 前端构建参数。

## 管理员账号

在本机创建管理员账号：

```bash
set -a
source .env.production
set +a
npm run crm:seed-admin
```

`.env.production` 不提交到 Git。需要的变量见 `.env.production.example`。

脚本保证指定邮箱为启用状态，并赋予 CRM 管理员权限。密码只通过环境变量传入。

## 验收

```bash
curl -I https://crm.yhi.cn
curl https://crm.yhi.cn/healthz
```

浏览器打开 `https://crm.yhi.cn`，使用管理员邮箱和密码登录。进入系统后，在用户管理中创建业务账号。
