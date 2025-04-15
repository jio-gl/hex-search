import winston from 'winston';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Define colors for each log level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Add colors to winston
winston.addColors(colors);

// Define the base format for logs
const baseFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true })
);

// Create format with component name
const createLogFormat = (component?: string) => {
  return winston.format.combine(
    baseFormat,
    winston.format.printf((info) => {
      const prefix = component ? `[${component}] ` : '';
      return `${info.timestamp} ${info.level}: ${prefix}${info.message}`;
    })
  );
};

// Define transports
const transports = [
  new winston.transports.Console(),
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
  }),
  new winston.transports.File({ filename: 'logs/all.log' }),
];

// Create the default logger
export const logger = winston.createLogger({
  level: level(),
  levels,
  format: createLogFormat(),
  transports,
});

// Create a named logger
export function createLogger(component: string) {
  return winston.createLogger({
    level: level(),
    levels,
    format: createLogFormat(component),
    transports,
  });
} 