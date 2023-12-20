const axios = require('axios');

const BASE_URL = "https://api.taqnyat.sa/wa/v2/messages/";
const headers = {
    'Authorization': `Bearer ${process.env.TAQNYAT_WHATSAPP_TOKEN}`,
    'Content-Type': 'application/json'
};
const sendSavedCartMessage = async (phone, cart) => {
    try {
        await axios.post(`${BASE_URL}`, {
            "to": phone.replace(" ", "").replace("+", ""),
            "type": "template",
            "template": {
                "name": "saved_carts",
                "language": {
                    "code": "ar"
                }
            },
            "components": [
                {
                    "type": "body",
                    "parameters": [
                        {
                            "type": "text",
                            "text": `${cart.customer.abandoned_checkout_url}`
                        }
                    ]
                }
            ]
        }, {
            headers: headers
        })
    } catch (error) {
        console.log(`failed to send whatsapp to ${phone}`, error);
    }
}

module.exports = { sendSavedCartMessage }