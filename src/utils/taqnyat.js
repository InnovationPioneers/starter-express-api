const axios = require('axios');

const BASE_URL = "https://api.taqnyat.sa/wa/v2/messages/";
const headers = {
    'Authorization': `Bearer ${process.env.TAQNYAT_WHATSAPP_TOKEN}`,
    'Content-Type': 'application/json'
};
const sendSavedCartMessage = async (phone, url, locale) => {
    try {
        const result = await axios.post(`${BASE_URL}`, {
            "to": phone.replace(" ", "").replace("+", ""),
            "type": "template",
            "template": {
                "name": "saved_carts",
                "language": {
                    "code": locale.includes("ar") ? "ar" : "en"
                }
            },
            "components": [
                {
                    "type": "body",
                    "parameters": [
                        {
                            "type": "text",
                            "text": `${url}`
                        }
                    ]
                }
            ]
        }, {
            headers: headers
        })

        return result;
    } catch (error) {
        console.log(`failed to send whatsapp to ${phone}`, error);
    }
}

const mapPhoneNumber = (phone, code) => {
    if (!phone) return null;
    let _phone = phone.replace(" ", "");
    _phone = _phone.replace("+", "");
    switch (code) {
        case "KW":
            _phone = (_phone.startsWith("965")) ? _phone : `965${_phone}`;
            break;
        case "SA":
            _phone = (_phone.startsWith("966")) ? _phone : `966${_phone}`;
            break;
        case "AE":
            _phone = (_phone.startsWith("971")) ? _phone : `971${_phone}`;
            break;
        case "OM":
            _phone = (_phone.startsWith("968")) ? _phone : `968${_phone}`;
            break;
        case "QA":
            _phone = (_phone.startsWith("974")) ? _phone : `974${_phone}`;
            break;
        default:
            break;
    }

    return _phone;
}

module.exports = { sendSavedCartMessage, mapPhoneNumber }