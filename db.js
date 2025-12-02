import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres.fcwajthkxusymctcsmhx',
  host: 'aws-1-ap-southeast-1.pooler.supabase.com',
  database: 'postgres',
  password: 'GsUWGZp7hAHqnepP', // keep your password
  port: 6543,
  ssl: { rejectUnauthorized: false },
  max: 10, // optional: max pool connections
});

export default pool;
