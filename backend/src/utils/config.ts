interface Config {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  db: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    poolMin: number;
    poolMax: number;
  };
  jwt: {
    accessSecret: string;
    accessExpiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  smtp: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
    fromName: string;
  };
  upload: {
    dir: string;
    maxSize: number;
    allowedTypes: string[];
  };
  frontendUrl: string;
  rateLimitWindowMs: number;
  rateLimitMax: number;
  razorpay: {
    keyId: string;
    keySecret: string;
  };
}

export const config: Config = {
  nodeEnv: process.env['NODE_ENV'] || 'development',
  port: parseInt(process.env['PORT'] || '5000', 10),
  apiPrefix: process.env['API_PREFIX'] || '/api/v1',

  db: {
    host:     process.env['DB_HOST']     || 'localhost',
    port:     parseInt(process.env['DB_PORT'] || '3306', 10),
    name:     process.env['DB_NAME']     || 'luvkush_natural',
    user:     process.env['DB_USER']     || 'root',
    password: process.env['DB_PASS']     || '',
    poolMin:  parseInt(process.env['DB_POOL_MIN'] || '2', 10),
    poolMax:  parseInt(process.env['DB_POOL_MAX'] || '10', 10),
  },

  jwt: {
    accessSecret:    process.env['JWT_SECRET']         || 'change-this-in-production',
    accessExpiresIn: process.env['JWT_ACCESS_EXPIRES'] || '15m',
    refreshSecret:   process.env['JWT_REFRESH_SECRET'] || 'change-refresh-in-production',
    refreshExpiresIn: process.env['JWT_REFRESH_EXPIRES'] || '7d',
  },

  smtp: {
    host:     process.env['SMTP_HOST']       || 'smtp.gmail.com',
    port:     parseInt(process.env['SMTP_PORT'] || '587', 10),
    user:     process.env['SMTP_USER']       || '',
    pass:     process.env['SMTP_PASS']       || '',
    from:     process.env['EMAIL_FROM']      || 'noreply@luvkushnatural.com',
    fromName: process.env['EMAIL_FROM_NAME'] || 'Luv Kush Natural',
  },

  upload: {
    dir:          process.env['UPLOAD_DIR']           || './uploads',
    maxSize:      parseInt(process.env['MAX_FILE_SIZE'] || '10485760', 10),
    allowedTypes: (process.env['ALLOWED_IMAGE_TYPES']  || 'image/jpeg,image/png,image/webp').split(','),
  },

  frontendUrl: process.env['FRONTEND_URL'] || 'http://localhost:4200',

  rateLimitWindowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000', 10),
  rateLimitMax:      parseInt(process.env['RATE_LIMIT_MAX']        || '100', 10),

  razorpay: {
    keyId:     process.env['RAZORPAY_KEY_ID']     || '',
    keySecret: process.env['RAZORPAY_KEY_SECRET'] || '',
  }
};
