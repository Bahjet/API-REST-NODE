import { knex as setupKnex, Knex } from 'knex'
import { env } from './env'
// npm run knex -- migrate:make create-transactions criando migration

export const config: Knex.Config = {
  client: env.DATABASE_CLIENT,
  // conection pode ser padrão sqlite ou pg
  connection:
    env.DATABASE_CLIENT === 'sqlite'
      ? { filename: env.DATABASE_URL }
      : env.DATABASE_URL,
  useNullAsDefault: true,
  migrations: {
    extension: 'ts',
    directory: './db/migrations',
  },
}

export const knex = setupKnex(config)
