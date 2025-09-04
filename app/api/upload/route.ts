import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-utils';
import { config } from '@/lib/config';
import OSS from 'ali-oss';
import { randomUUID } from 'crypto';

/**
 * 处理文件上传到阿里云 OSS
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyToken();
    if (!auth.success) {
      return auth.response;
    }

    const { userId } = auth.user;

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // 验证文件大小 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    // 检查是否配置了OSS
    if (
      !config.oss.accessKeyId ||
      !config.oss.accessKeySecret ||
      !config.oss.bucket
    ) {
      // 如果没有配置OSS，返回一个占位URL
      return NextResponse.json({
        url: `/api/placeholder-image?name=${file.name}`,
        filename: file.name,
      });
    }

    // 校验 region 格式，防止使用 cn-hangzhou 而不是 oss-cn-hangzhou
    if (config.oss.region && !config.oss.region.startsWith('oss-')) {
      console.warn(
        `OSS_REGION looks unusual: "${config.oss.region}". It should look like "oss-cn-hangzhou".`,
      );
    }

    //  （优先使用自定义 endpoint，且强制 HTTPS）
    const client = new OSS({
      region: config.oss.region,
      accessKeyId: config.oss.accessKeyId,
      accessKeySecret: config.oss.accessKeySecret,
      bucket: config.oss.bucket,
      endpoint: config.oss.endpoint || undefined,
      secure: true,
    });

    // 生成唯一文件名
    const fileExtension = file.name.split('.').pop();
    const fileName = `uploads/${userId}/${Date.now()}-${randomUUID()}.${fileExtension}`;

    // 将File转换为Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 上传到OSS
    const result = await client.put(fileName, buffer, {
      headers: {
        'Content-Type': file.type,
      },
    });

    return NextResponse.json({
      url: result.url,
      filename: file.name,
    });
  } catch (error) {
    console.error('File upload error:', {
      error,
      region: config.oss.region,
      endpoint: config.oss.endpoint,
      bucket: config.oss.bucket,
    });
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
