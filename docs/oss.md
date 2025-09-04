### 阿里云 OSS 使用说明

> 适用于本项目的服务端上传实现。包含环境变量配置、客户端初始化、上传流程、排错与最佳实践。

## 环境准备

- **依赖版本**: `ali-oss@^6.21.0`
- **必要环境变量**（放在 `.env.local` 或部署环境变量中）

```bash
# 基本配置
OSS_REGION=oss-cn-hangzhou               # 建议使用带前缀的区域名：oss-cn-*
OSS_ACCESS_KEY_ID=你的AK
OSS_ACCESS_KEY_SECRET=你的SK
OSS_BUCKET=你的Bucket名

# 可选：自定义或外网/内网 endpoint（HTTPS）
OSS_ENDPOINT=https://oss-cn-hangzhou.aliyuncs.com
```

- **注意**：`OSS_REGION` 应使用 `oss-cn-xxx` 格式，而不是 `cn-xxx`。例如 `oss-cn-hangzhou`。
- 若使用自定义域名（CNAME），将 `OSS_ENDPOINT` 设置为你的自定义域名（如 `https://img.example.com`），并在客户端添加 `cname: true`（见下文进阶配置）。

## 服务端上传流程

服务端接口：`app/api/upload/route.ts`

```ts
/**
 * 处理文件上传到阿里云 OSS
 * - 验证登录、类型与大小
 * - 使用 ali-oss 直传 Buffer
 * - 返回 OSS 访问 URL
 */
```

```startLine:48:endLine:71:app/api/upload/route.ts
// 初始化OSS客户端（优先使用自定义 endpoint，且强制 HTTPS）
const client = new OSS({
  region: config.oss.region,
  accessKeyId: config.oss.accessKeyId,
  accessKeySecret: config.oss.accessKeySecret,
  bucket: config.oss.bucket,
  endpoint: config.oss.endpoint || undefined,
  secure: true,
});

// 上传到OSS
const result = await client.put(fileName, buffer, {
  headers: {
    'Content-Type': file.type,
  },
});
```

- 文件名规范：`uploads/{userId}/{timestamp}-{uuid}.{ext}`，便于分用户、避免冲突
- 未配置 OSS 时，接口会返回占位图 URL：`/api/placeholder-image?name=...`

## 前端调用示例

前端以 `multipart/form-data` 提交，字段名为 `file`。

```ts
/**
 * 使用 Fetch 上传文件到服务端 API
 * @param file 要上传的文件对象
 */
export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error('Upload failed');
  }

  const data = await res.json();
  return data.url as string;
}
```

## 常见错误与排查

- **ENOTFOUND / DNS 解析失败**
  - 现象：域名类似 `wl6399.cn-hangzhou.aliyuncs.com`（缺少 `oss-` 前缀）
  - 处理：确保 `OSS_REGION=oss-cn-hangzhou`；若使用 `OSS_ENDPOINT`，需为完整 HTTPS 域名
- **NoSuchBucket / 404**
  - 检查 `OSS_BUCKET` 是否正确、Bucket 是否在对应区域
- **InvalidAccessKeyId / SignatureDoesNotMatch**
  - 校验 AK/SK 是否正确，是否有额外空格或换行
- **AccessDenied**
  - RAM 策略权限不足；确认对目标 Bucket 的 `oss:PutObject` 权限
- **EntityTooLarge (413)**
  - 超过后端限制或前端限制；本项目后端限制为 10MB（可按需修改）
- **CORS 跨域**
  - 若前端直传（当前项目是经服务端转发，不受限），需在 OSS 控制台配置 CORS 规则

### 网络连通性排查

- DNS：`nslookup <你的Bucket>.oss-cn-hangzhou.aliyuncs.com`
- HTTP：`curl -I https://<你的Bucket>.oss-cn-hangzhou.aliyuncs.com`
- 代理：若在受限网络，配置系统/进程 `HTTPS_PROXY`/`HTTP_PROXY`

## 进阶配置

- **自定义域名（CNAME）**
  - 在 OSS 控制台配置 CNAME（如 `img.example.com` 指向 Bucket 域名）
  - 客户端启用：

```ts
/**
 * 启用 CNAME 的 OSS 客户端示例
 */
const client = new OSS({
  accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET!,
  bucket: process.env.OSS_BUCKET!,
  endpoint: 'https://img.example.com',
  cname: true,
  secure: true,
});
```

- **内网/专有网络（VPC）**

  - 若在同地域的阿里云 ECS 内访问，可使用内网 endpoint（`-internal`），并根据网络策略配置安全组

- **STS 临时凭证（最佳实践）**
  - 生产环境建议使用 STS 临时凭证（更安全），用服务端颁发临时 Token 给前端直传或服务端使用临时凭证直传

## 安全与合规建议

- 使用专有 RAM 用户与最小权限策略（只授予必要的 `PutObject` 等操作）
- 不在前端暴露永久 AK/SK（当前方案为服务端直传）
- 结合对象生命周期（Lifecycle）自动清理无用文件

## 配置检查清单

- [ ] `OSS_REGION`：形如 `oss-cn-hangzhou`
- [ ] `OSS_BUCKET`：真实存在且与区域匹配
- [ ] `OSS_ENDPOINT`：HTTPS，必要时为自定义域名
- [ ] 网络：无 DNS/防火墙限制，必要时配置代理

## 常用问答（FAQ）

- **返回 URL 是 HTTP 怎么办？**
  - 本项目已 `secure: true` 强制 HTTPS；若仍为 HTTP，检查是否使用了 HTTP 的自定义域名
- **如何自定义文件名或目录结构？**
  - 修改 `app/api/upload/route.ts` 中生成 `fileName` 的逻辑
- **如何限制上传类型/大小？**
  - 修改服务端的白名单与大小常量（默认 10MB）

## 参考

- 阿里云文档：`https://help.aliyun.com/zh/oss/`
- SDK 文档：`https://www.npmjs.com/package/ali-oss`
