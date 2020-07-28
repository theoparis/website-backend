import express from 'express'
import Stripe from 'stripe'
// import { getProducts, stripe } from '../config'
const router = express.Router()
/* 
router.get('/test', async (req, res) => {
  var result = await stripe.orders.create({
    currency: 'usd',
    email: 'joe.mama@example.com',
    items: [{ type: 'sku', parent: 'sku_Gz0TWKj4TnEY5v' }],
    shipping: {
      name: 'Joe Mama',
      address: {
        line1: '1234 Main Street',
        city: 'San Francisco',
        state: 'CA',
        country: 'US',
        postal_code: '94111',
      },
    },
  })
  await stripe.orders.pay(result.id, { source: 'tok_visa_debit' })
  res.send(result)
})

router.get('/', async (req, res) => {
  const products = await getProducts()
  res.render('store/store', { user: req.session.user, products })
})
 */
export const storeRouter = router
