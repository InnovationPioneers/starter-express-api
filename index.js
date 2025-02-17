const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios');
const cron = require("node-cron");
const { updateCustomerPhone, getCustomerByPhone, cancelOrder, getOrderById, getAbandonedCheckouts, getCustomerCODOrders } = require('./src/services/shopify')
const { sendSavedCartMessage, mapPhoneNumber } = require('./src/utils/taqnyat');

const app = express()

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(bodyParser.text())
app.use(express.static('public'))

app.all('/', (req, res) => {
    console.log("Just got a request!")
    res.send('Hi Smile Custom APP!')
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

        if (!result || !result?.order) {
            return res.sendStatus(204);
        }
        const status = result.order.cancelled_at ? "Cancelled" : ((result.order.closed_at ? "Closed" : "Open"));
        return res.json({
            id: result.order.id,
            status: status,
            customer: result.order.customer
        });
    } catch (error) {
        console.log("error while fetching order", error);
    }
    res.sendStatus(200);
});

app.post('/whatsapp', async (req, res) => {
    console.log("Whatsapp Request", req.body);
    // if (!req.headers?.authorization) {
    //     res.status(401).json({ error: 'Unauthorized Credentials!' });
    //     return;
    // }
    // const token = req.headers.authorization.split(' ')[1];
    // if (token != process.env.WHATSAPP_BEARER_TOKEN) {
    //     res.status(403).json({ error: 'Unauthorized Credentials!' });
    //     return;
    // }
    // let newBody = req.body.replace(/\\"/g, '"');
    const body = req.body;
    try {
        const result = await getCustomerByPhone(body.phone);
        if (result?.customers?.length > 0) {
            let customer = result.customers[0];
            console.log("Cancellation Request with text", body?.reply ?? body?.text ?? "");
            if (body?.text == "2" || body?.reply == "2" || body?.reply == "الغاء" ||
                body?.text == "الغاء" || body?.reson == "الغاء" ||
                body?.reply?.toLowerCase() == "cancel" ||
                body?.text?.toLowerCase() == "cancel" || body?.reson?.toLowerCase() == "cancel") {
                const order = await getCustomerCODOrders(customer);
                if (order)
                    await cancelOrder(order.id);
            }
        }
    } catch (error) {
        console.log("Cancellation Request Error", error);
        console.log("error", error);
    }
    res.sendStatus(200);
});


app.post('/customer-update', async (req, res) => {
    if (!req.headers?.authorization) {
        res.status(401).json({ error: 'Unauthorized Credentials!' });
        return;
    }
    const token = req.headers.authorization.split(' ')[1];
    if (token != process.env.WHATSAPP_BEARER_TOKEN) {
        res.status(403).json({ error: 'Unauthorized Credentials!' });
        return;
    }
    try {
        const body = req.body;
        if (!body.phone) {
            res.status(400).json({
                status: "failed",
                error: "phone number not provided"
            });
        }
        await updateCustomerPhone(body.id, body.phone);
    } catch (error) {
        console.log("error", error);
        res.status(400).json({
            status: "failed",
            error: error
        });
    }
    res.sendStatus(200);
});

app.post('/webhook/customer-created', async (req, res) => {
    const customer = req.body;
    if (!customer.note) {
        return res.sendStatus(204);
    }
    const result = await updateCustomerPhone(customer.id, `+${customer.note}`);
    if (!result) {
        return res.sendStatus(204);
    }
    res.sendStatus(200);
});

app.post('/notify-abandoned-checkouts', async (req, res) => {
    res.sendStatus(200);

    const { skip } = req.query;

    try {
        if (skip) {
            console.log("Skipped");
        }
        
        const checkouts = await getAbandonedCheckouts();
        let promises = [];
        checkouts.forEach(async (cart) => {
            const { shipping_address, billing_address, customer_locale, customer, abandoned_checkout_url } = cart;
            const address = shipping_address ?? billing_address;
            const country_code = address.country_code;
            const phone = customer.phone ?? customer.note ?? mapPhoneNumber(address.phone, country_code);
            if (!phone) return;
    
            promises.push(sendSavedCartMessage(phone, abandoned_checkout_url, customer_locale));
        });
    
        if (!skip) {
            await Promise.allSettled(promises).catch(error => {
                console.log("Failed to send saved cart message: ", error);
            });
        }
    } catch (error) {
        console.log("error saved carts", error);
    }
});

app.listen(process.env.PORT || 3000)