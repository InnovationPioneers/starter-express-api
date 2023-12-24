const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios');
const cron = require("node-cron");
const { updateCustomerPhone, getCustomerByPhone, cancelOrder, getOrderById, getAbandonedCheckouts } = require('./src/services/shopify')
const { sendSavedCartMessage } = require('./src/utils/taqnyat');

const app = express()

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(bodyParser.text())

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
    let newBody = req.body.replace(/\\"/g, '"');
    const body = JSON.parse(newBody);
    try {
        const result = await getCustomerByPhone(body.from);
        console.log("customers result", result);
        if (result?.customers?.length > 0) {
            let customer = result.customers[0];
            console.log("Cancellation Request with text", body?.reply ?? body?.text ?? "");
            if (body?.text == "2" || body?.reply == "2" || body?.reply == "إلغاء" || body?.text == "إلغاء") {
                console.log("Cancellation Request Valid");
                await cancelOrder(customer.last_order_id);
                console.log("Cancellation Request Done");
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
    // console.log("notify abandoned carts");
    // if (!req.headers['X-SECRET-KEY']) {
    //     res.status(401).json({ error: 'Unauthorized Credentials!' });
    //     return;
    // }
    // if (req.headers['X-SECRET-KEY'] != "fybnqmf") {
    //     res.status(401).json({ error: 'Unauthorized Credentials!' });
    //     return;
    // }
    const checkouts = await getAbandonedCheckouts();
    checkouts.forEach(async (cart) => {
        const phone = cart.customer.phone ?? cart.customer.note;
        if (!phone) return;
        await sendSavedCartMessage(phone, cart);
    });
    return res.sendStatus(200);
});

cron.schedule(" * */2 * * * *", () => {
    console.log("A cron job that runs every 2 minutes");
});


app.listen(process.env.PORT || 3000)