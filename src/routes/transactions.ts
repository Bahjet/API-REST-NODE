import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { checkSessionIdExists } from '../middlewares/check-session-id'

export async function transactionsRoutes(app: FastifyInstance) {
  // reply seria o response no fastfy, fizeram assim para não ficar igual ao express

  // rota para obter todas transações
  app.get(
    '/',
    { preHandler: [checkSessionIdExists] }, // preHandler executa PRIMEIRO as funções especificadas dentro do array e depois executa a função get
    async (request) => {
      const { sessionId } = request.cookies

      const transactions = await knex('transactions')
        .where('session_id', sessionId)
        .select('*')

      return { transactions }
    },
  )

  // rota para obter uma transação pelo id
  app.get('/:id', { preHandler: [checkSessionIdExists] }, async (request) => {
    const getTransactionParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getTransactionParamsSchema.parse(request.params)

    const { sessionId } = request.cookies

    const transaction = await knex('transactions')
      .where('id', id)
      .andWhere('session_id', sessionId)
      .first() // .first não deixa mandar uma array trazendo em objeto
    // outra forma de fazer a query:  .where({session_id: sessionId, id}).first()

    return { transaction }
  })

  // rota para obter o resumo da conta
  app.get(
    '/summary',
    { preHandler: [checkSessionIdExists] },
    async (request) => {
      const { sessionId } = request.cookies

      const summary = await knex('transactions')
        .where('session_id', sessionId)
        .sum('amount', { as: 'amount' })
        .first()

      return { summary }
    },
  )

  // rota para criar uma transação
  app.post('/', async (request, reply) => {
    // vamos receber do body da requisição { title, amount, type: credit ou debit}

    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit']),
    })

    const { title, amount, type } = createTransactionBodySchema.parse(
      request.body,
    )

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days tempo disponivel do cookie, último número corresponde a quantidade de dias
      })
    }

    await knex('transactions').insert({
      id: randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1,
      session_id: sessionId,
    })

    return reply.status(201).send()
  })
}
