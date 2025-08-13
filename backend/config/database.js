/**
 * 智能数据库配置管理
 * 根据环境自动选择数据库类型和配置
 */

const path = require('path');

class DatabaseConfig {
  constructor() {
    this.isRailway = process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_SERVICE_NAME;
    this.isProduction = process.env.NODE_ENV === 'production';
    this.isLocal = !this.isRailway && !this.isProduction;
    
    this.config = this.getConfig();
  }

  getConfig() {
    if (this.isRailway || this.isProduction) {
      return this.getPostgreSQLConfig();
    } else {
      return this.getSQLiteConfig();
    }
  }

  getPostgreSQLConfig() {
    return {
      provider: 'postgresql',
      url: process.env.DATABASE_URL,
      description: 'PostgreSQL (Railway/Production)',
      features: ['ACID', 'Concurrent connections', 'Advanced queries']
    };
  }

  getSQLiteConfig() {
    const dbPath = path.join(__dirname, '../prisma/data/app.db');
    return {
      provider: 'sqlite',
      url: `file:${dbPath}`,
      description: 'SQLite (Local Development)',
      features: ['File-based', 'Zero-config', 'Fast development']
    };
  }

  getCurrentConfig() {
    return {
      environment: this.isLocal ? 'local' : 'railway',
      provider: this.config.provider,
      description: this.config.description,
      features: this.config.features,
      isLocal: this.isLocal,
      isRailway: this.isRailway,
      isProduction: this.isProduction
    };
  }

  validateConfig() {
    const errors = [];
    
    if (this.isRailway || this.isProduction) {
      if (!process.env.DATABASE_URL) {
        errors.push('DATABASE_URL is required for Railway/Production');
      }
      if (!process.env.DATABASE_URL.includes('postgresql://')) {
        errors.push('DATABASE_URL must be a PostgreSQL connection string');
      }
    } else {
      // 本地环境检查
      const fs = require('fs');
      const dbDir = path.dirname(this.config.url.replace('file:', ''));
      if (!fs.existsSync(dbDir)) {
        errors.push(`Local database directory does not exist: ${dbDir}`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  printConfig() {
    console.log('🗄️ 数据库配置信息:');
    console.log(`   环境: ${this.isLocal ? '本地开发' : 'Railway/生产'}`);
    console.log(`   提供者: ${this.config.provider}`);
    console.log(`   描述: ${this.config.description}`);
    console.log(`   特性: ${this.config.features.join(', ')}`);
    
    const validation = this.validateConfig();
    if (validation.isValid) {
      console.log('   ✅ 配置验证通过');
    } else {
      console.log('   ❌ 配置验证失败:');
      validation.errors.forEach(error => console.log(`      - ${error}`));
    }
  }
}

module.exports = DatabaseConfig;
