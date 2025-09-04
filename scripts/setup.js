#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function colorize(text, color) {
  return colors[color] + text + colors.reset;
}

function log(text, color = 'reset') {
  console.log(colorize(text, color));
}

// 创建交互式输入接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

// 模板配置
const config = {
  appName: '',
  description: '',
  author: '',
  repository: '',
  database: '',
  features: {
    auth: true,
    pwa: true,
    upload: true,
    email: true,
  },
};

async function welcome() {
  log('\n🚀 Welcome to Next.js Fullstack Template Setup!\n', 'cyan');
  log('This wizard will help you configure your new project.\n', 'yellow');
}

async function collectBasicInfo() {
  log('📝 Basic Information', 'blue');
  log('─'.repeat(50), 'blue');

  config.appName =
    (await question('App name (My Awesome App): ')) || 'My Awesome App';
  config.description =
    (await question('Description (A modern fullstack app): ')) ||
    'A modern fullstack app';
  config.author = (await question('Author name: ')) || 'Your Name';
  config.repository = (await question('Repository URL (optional): ')) || '';

  log('');
}

async function selectDatabase() {
  log('🗄️  Database Configuration', 'blue');
  log('─'.repeat(50), 'blue');

  log('Choose your database:');
  log('1) MySQL (Recommended)');
  log('2) PostgreSQL');
  log('3) SQLite (Development only)');

  const dbChoice = (await question('Database (1-3) [1]: ')) || '1';

  switch (dbChoice) {
    case '1':
      config.database = 'mysql';
      break;
    case '2':
      config.database = 'postgresql';
      break;
    case '3':
      config.database = 'sqlite';
      break;
    default:
      config.database = 'mysql';
  }

  log(`Selected: ${config.database}`, 'green');
  log('');
}

async function selectFeatures() {
  log('✨ Feature Selection', 'blue');
  log('─'.repeat(50), 'blue');

  const authAnswer = await question('Include authentication system? (Y/n): ');
  config.features.auth = !authAnswer.toLowerCase().startsWith('n');

  const pwaAnswer = await question('Include PWA support? (Y/n): ');
  config.features.pwa = !pwaAnswer.toLowerCase().startsWith('n');

  const uploadAnswer = await question('Include file upload? (Y/n): ');
  config.features.upload = !uploadAnswer.toLowerCase().startsWith('n');

  const emailAnswer = await question('Include email service? (Y/n): ');
  config.features.email = !emailAnswer.toLowerCase().startsWith('n');

  log('');
}

function updatePackageJson() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');

  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    packageJson.name = config.appName.toLowerCase().replace(/\s+/g, '-');
    packageJson.description = config.description;
    packageJson.author = config.author;

    if (config.repository) {
      packageJson.repository = {
        type: 'git',
        url: config.repository,
      };
    }

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    log('✅ Updated package.json', 'green');
  }
}

function updateConfig() {
  const configPath = path.join(process.cwd(), 'lib', 'config.ts');

  if (fs.existsSync(configPath)) {
    let configContent = fs.readFileSync(configPath, 'utf8');

    // 替换应用名称
    configContent = configContent.replace(
      /export const APP_NAME = .+;/,
      `export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || '${config.appName}';`,
    );

    // 替换描述
    configContent = configContent.replace(
      /description: APP_NAME,/,
      `description: '${config.description}',`,
    );

    fs.writeFileSync(configPath, configContent);
    log('✅ Updated lib/config.ts', 'green');
  }
}

function updateManifest() {
  if (!config.features.pwa) return;

  const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');

  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    manifest.name = config.appName;
    manifest.short_name = config.appName.slice(0, 12);
    manifest.description = config.description;

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    log('✅ Updated manifest.json', 'green');
  }
}

function createEnvExample() {
  const envExamplePath = path.join(process.cwd(), 'env.example');
  let envContent = `# Application
NEXT_PUBLIC_APP_NAME="${config.appName}"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Database
DATABASE_URL="${getDatabaseUrl()}"

# Security
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
`;

  if (config.features.email) {
    envContent += `
# Email Service (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
FROM_NAME="${config.appName}"
`;
  }

  if (config.features.upload) {
    envContent += `
# File Upload - Alibaba Cloud OSS (Optional)
OSS_REGION="oss-cn-hangzhou"
OSS_ACCESS_KEY_ID="your-access-key-id"
OSS_ACCESS_KEY_SECRET="your-access-key-secret"
OSS_BUCKET="your-bucket-name"
OSS_ENDPOINT="https://oss-cn-hangzhou.aliyuncs.com"
`;
  }

  fs.writeFileSync(envExamplePath, envContent);
  log('✅ Created env.example', 'green');
}

function getDatabaseUrl() {
  switch (config.database) {
    case 'mysql':
      return 'mysql://username:password@localhost:3306/database_name';
    case 'postgresql':
      return 'postgresql://username:password@localhost:5432/database_name';
    case 'sqlite':
      return 'file:./dev.db';
    default:
      return 'mysql://username:password@localhost:3306/database_name';
  }
}

function removeUnusedFeatures() {
  // 如果不需要认证，移除相关文件
  if (!config.features.auth) {
    const authFiles = [
      'app/api/auth',
      'app/(auth)',
      'components/login-form',
      'middleware.ts',
    ];

    authFiles.forEach((file) => {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        fs.rmSync(filePath, { recursive: true, force: true });
      }
    });
    log('🗑️  Removed authentication files', 'yellow');
  }

  // 如果不需要PWA，移除相关文件
  if (!config.features.pwa) {
    const pwaFiles = [
      'public/manifest.json',
      'public/sw.js',
      'components/sw-register.tsx',
      'components/pwa-install-prompt.tsx',
    ];

    pwaFiles.forEach((file) => {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        fs.rmSync(filePath, { recursive: true, force: true });
      }
    });
    log('🗑️  Removed PWA files', 'yellow');
  }

  // 如果不需要文件上传，移除相关API
  if (!config.features.upload) {
    const uploadPath = path.join(process.cwd(), 'app/api/upload');
    if (fs.existsSync(uploadPath)) {
      fs.rmSync(uploadPath, { recursive: true, force: true });
    }
    log('🗑️  Removed upload API', 'yellow');
  }
}

function createSetupSummary() {
  log('\n📋 Setup Summary', 'cyan');
  log('─'.repeat(50), 'cyan');
  log(`App Name: ${config.appName}`, 'green');
  log(`Description: ${config.description}`, 'green');
  log(`Author: ${config.author}`, 'green');
  log(`Database: ${config.database}`, 'green');
  log(`Repository: ${config.repository || 'Not specified'}`, 'green');

  log('\nFeatures:', 'blue');
  log(
    `✅ Authentication: ${config.features.auth ? 'Enabled' : 'Disabled'}`,
    config.features.auth ? 'green' : 'red',
  );
  log(
    `✅ PWA Support: ${config.features.pwa ? 'Enabled' : 'Disabled'}`,
    config.features.pwa ? 'green' : 'red',
  );
  log(
    `✅ File Upload: ${config.features.upload ? 'Enabled' : 'Disabled'}`,
    config.features.upload ? 'green' : 'red',
  );
  log(
    `✅ Email Service: ${config.features.email ? 'Enabled' : 'Disabled'}`,
    config.features.email ? 'green' : 'red',
  );
}

function showNextSteps() {
  log('\n🎉 Setup Complete!', 'cyan');
  log('─'.repeat(50), 'cyan');
  log('\nNext steps:', 'blue');
  log(
    '1. Copy env.example to .env.local and configure your environment variables',
    'yellow',
  );
  log('2. Install dependencies: npm install', 'yellow');
  log(
    '3. Setup your database: npm run db:generate && npm run db:push && npm run db:seed',
    'yellow',
  );
  log('4. Start development: npm run dev', 'yellow');

  log('\n📚 Useful commands:', 'blue');
  log('npm run dev          - Start development server', 'green');
  log('npm run build        - Build for production', 'green');
  log('npm run db:studio    - Open Prisma Studio', 'green');
  log('npm test             - Run tests', 'green');

  if (config.features.auth) {
    log('\n🔐 Test Account (after running db:seed):', 'blue');
    log('Email: test@prisma.io', 'green');
    log('Password: 123456', 'green');
  }

  log('\n🆘 Need help?', 'blue');
  log('- Check README.md for detailed instructions', 'yellow');
  log('- Read TEMPLATE_GUIDE.md for customization tips', 'yellow');
  log(
    '- Visit https://github.com/your-username/nextjs-fullstack-template/issues',
    'yellow',
  );

  log('\n🌟 Happy coding!', 'magenta');
}

async function main() {
  try {
    await welcome();
    await collectBasicInfo();
    await selectDatabase();
    await selectFeatures();

    log('🔧 Configuring your project...', 'yellow');

    updatePackageJson();
    updateConfig();
    updateManifest();
    createEnvExample();
    removeUnusedFeatures();

    createSetupSummary();
    showNextSteps();
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    rl.close();
  }
}

// 运行设置向导
if (require.main === module) {
  main();
}

module.exports = { main };
