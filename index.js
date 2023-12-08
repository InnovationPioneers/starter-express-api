const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios')
const { updateCustomerPhone, getCustomerByPhone, cancelOrder } = require('./src/services/shopify')

const app = express()

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.all('/', (req, res) => {
    console.log("Just got a request!")
    res.send('Yo!')
});

app.post('/whatsapp', async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    if (token != process.env.WHATSAPP_BEARER_TOKEN) {
        res.status(403).json({ error: 'Unauthorized Credentials!' });
        return;
    }
    let body = req.body;
    const result = await getCustomerByPhone(body.from);
    if (result?.customers?.length > 0) {
        let customer = result.customers[0];
        if (body.text == "2") {
            await cancelOrder(customer.last_order_id);
        }
    }
    res.sendStatus(200);
});

app.post('/webhook/customer-created', async (req, res) => {
    const customer = req.body;
    await updateCustomerPhone(customer);
    res.sendStatus(200);
});

app.listen(process.env.PORT || 3000)