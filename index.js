const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios')
const { updateCustomerPhone, getCustomerByPhone, cancelOrder, getOrderById } = require('./src/services/shopify')

const app = express()

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(bodyParser.text())

app.all('/', (req, res) => {
    console.log("Just got a request!")
    res.send('Yo!')
});


app.get("/order-status/:id", async (req, res) => {
    if (!req.headers?.authorization) {
        res.status(401).json({ error: 'Unauthorized Credentials!' });
        return;
    }
    const token = req.headers.authorization.split(' ')[1];
    if (token != process.env.WHATSAPP_BEARER_TOKEN) {
        res.status(403).json({ error: 'Unauthorized Credentials!' });
        return;
    }
    if (!req.params?.id) {
        res.status(400).json({ error: 'Missing order id!' });
        return;
    }
    try {
        const result = await getOrderById(req.params.id);
        console.log("order result", result);

        if (!result) {
            return res.sendStatus(204);
        }
        const status = result.cancelled_at ? "Cancelled" : ((result.closed_at ? "Closed": "Open"));
        return res.json({
            id: result.id,
            status: status,
            customer: result.customer
        });
    } catch (error) {
        console.log("error while fetching order", error);
    }
    res.sendStatus(200);
});

app.post('/whatsapp', async (req, res) => {
    console.log("Whatsapp Request", req.body);
    if (!req.headers?.authorization) {
        res.status(401).json({ error: 'Unauthorized Credentials!' });
        return;
    }
    const token = req.headers.authorization.split(' ')[1];
    if (token != process.env.WHATSAPP_BEARER_TOKEN) {
        res.status(403).json({ error: 'Unauthorized Credentials!' });
        return;
    }
    let newBody = req.body.replace(/\\"/g, '"');
    const body = JSON.parse(newBody);
    console.log("body", body);
    try {
        const result = await getCustomerByPhone(body.from);
        console.log("customers result", result);
        if (result?.customers?.length > 0) {
            let customer = result.customers[0];
            if (body?.text == "2" || body?.reply == "2") {
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