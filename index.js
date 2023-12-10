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
    console.log("Whatsapp Request", req);
    if (!req.headers?.authorization) {
        res.status(401).json({ error: 'Unauthorized Credentials!' });
        return;
    }
    const token = req.headers.authorization.split(' ')[1];
    if (token != process.env.WHATSAPP_BEARER_TOKEN) {
        res.status(403).json({ error: 'Unauthorized Credentials!' });
        return;
    }
    const body = JSON.parse(req.body);
    console.log("body", body);
    try {
        const result = await getCustomerByPhone(body.from);
        console.log("customers result", result);
        if (result?.customers?.length > 0) {
            let customer = result.customers[0];
            if (body.text == "2") {
                await cancelOrder(customer.last_order_id);
            }
        }
    } catch (error) {
        console.log("error", error);
    }
    res.sendStatus(200);
});

app.post('/webhook/customer-created', async (req, res) => {
    const customer = req.body;
    if (!customer.note) {
        return res.sendStatus(204);
    }
    const result = await updateCustomerPhone(customer);
    if (!result) {
        return res.sendStatus(204);
    }
    res.sendStatus(200);
});

app.listen(process.env.PORT || 3000)