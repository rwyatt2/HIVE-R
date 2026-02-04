
import { config } from 'dotenv';
console.log('--- START STDOUT ---');
console.error('--- START STDERR ---');
process.env.DOTENV_CONFIG_QUIET = 'true';
config();
console.log('--- END STDOUT ---');
console.error('--- END STDERR ---');
