import { app } from './app'
import { env } from './env'

app
  .listen({
    host: '127.0.0.1',
    port: env.PORT,
  })
  .then(() => {
    console.log('HTTP Server Running! rodando na porta: ' + env.PORT)
  })
