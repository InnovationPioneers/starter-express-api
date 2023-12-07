const express = require('express')
const bodyParser = require('body-parser')
const app = express()

app.use(bodyparser.urlencoded({ extended: true }))
app.use(bodyparser.json())

app.all('/', (req, res) => {
    console.log("Just got a request!")
    res.send('Yo!')
});

app.post('/whatsapp', (req, res) => {
    res.send('Whatsapp!')
});

app.post('/webhook/customer-created', (req, res) => {
    console.log("BODY:", req.body);
    res.sendStatus(200);
});

app.listen(process.env.PORT || 3000)