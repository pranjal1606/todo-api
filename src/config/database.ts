import { DataSource } from "typeorm";
import dotenv from "dotenv";

dotenv.config();

export const db = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST as string,
  port: parseInt(process.env.DB_PORT as string),
  username: process.env.DB_USER as string,
  password: process.env.DB_PASSWORD as string,
  database: process.env.DB_NAME as string,
  synchronize: false, // Auto-create tables (turn off in production)
  // Logging means: showing database activity in the terminal/console. TypeORM can print:, SQL queries, errors, warnings, schema changes, migrations
  logging: false,
  // entities: which classes are TypeORM entities (tables) in your project. TypeORM needs this to create tables.
  entities: ["src/**/entities/**/*.ts"],
  // subscribers: classes that listen to TypeORM events (like beforeInsert, afterLoad). You can leave this empty if you don't need event listeners.
  subscribers: [],
  // migrations: SQL scripts that create/update your database schema (tables, columns, indexes). They are run manually.
  migrations: ["src/migrations/*.ts"],
});
