import { test, beforeAll, afterAll, describe, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'
import { execSync } from 'node:child_process'

describe('Transactions routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    // antes de cada um test deleta todos bancos e cria novamente
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  test('User can create a new transaction', async () => {
    // test chamada HTTP para criar uma nova transação POST
    await request(app.server) // coloca o server do node
      .post('/transactions')
      .send({ title: 'New transaction', amount: 5000, type: 'credit' })
      .expect(201)
  })

  test('User can list all transactions', async () => {
    // test chamada HTTP para listar as transações GET
    // todos testes devem trabalhar de maneira individual, nesse caso precisamos dar um POST para depois dar um GET
    const createTransactionResponse = await request(app.server) // coloca o server do node
      .post('/transactions')
      .send({ title: 'New transaction', amount: 5000, type: 'credit' })

    const cookies = String(createTransactionResponse.get('Set-Cookie'))

    const listTransactionsResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)

    expect(listTransactionsResponse.body.transactions).toEqual([
      expect.objectContaining({ title: 'New transaction', amount: 5000 }),
    ])
  })

  test('User can list a specific transaction', async () => {
    // test chamada HTTP para listar uma transação especifica filtrando pelo id GET:id
    const createTransactionResponse = await request(app.server) // coloca o server do node
      .post('/transactions')
      .send({ title: 'New transaction', amount: 5000, type: 'credit' })

    const cookies = String(createTransactionResponse.get('Set-Cookie'))

    const listTransactionsResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)

    const transactionId = listTransactionsResponse.body.transactions[0].id

    const getTransactionResponse = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookies)
      .expect(200)

    expect(getTransactionResponse.body.transaction).toEqual(
      expect.objectContaining({ title: 'New transaction', amount: 5000 }),
    )
  })

  test('User can get the summary', async () => {
    // test chamada HTTP para listar as transações GET
    // todos testes devem trabalhar de maneira individual, nesse caso precisamos dar um POST para depois dar um GET
    const createTransactionResponse = await request(app.server) // coloca o server do node
      .post('/transactions')
      .send({ title: 'New transaction', amount: 5000, type: 'credit' })

    const cookies = String(createTransactionResponse.get('Set-Cookie'))

    await request(app.server)
      .post('/transactions')
      .set('Cookie', cookies)
      .send({ title: 'Debit transaction', amount: 2000, type: 'debit' })

    const summaryResponse = await request(app.server)
      .get('/transactions/summary')
      .set('Cookie', cookies)
      .expect(200)

    expect(summaryResponse.body.summary).toEqual({ amount: 3000 })
  })
})
