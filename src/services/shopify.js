const axios = require('axios');

const headers = {
    'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
    'Content-Type': 'application/json'
};

const SHOP = process.env.SHOPIFY_SHOP_NAME;
const BASE_URL = `https://${SHOP}.myshopify.com/admin/api/2023-04`;

const updateCustomerPhone = async (id, phone) => {
    let data = {
        "customer": {
            "phone": phone
        }
    };
    const result = await axios.put(
        `${BASE_URL}/customers/${id}.json`, data,
        {
            headers
        }
    ).then(res => {
        console.log(res);
    }).catch(err => {
        console.log(err);
    });

    return result;
}


const cancelOrder = async (order_id) => {
    try {
        return await axios.post(`${BASE_URL}/orders/${order_id}/cancel.json`, {}, {
            headers: headers
        })
    } catch (error) {
        console.log(`failed to cancel order ${order_id}`, error);
    }
}

const getCustomerByPhone = async (phone) => {
    let trimmedPhone = (phone).replace(/\s/g, "");
    trimmedPhone = trimmedPhone.replace("+", "");

    let config = {
        headers: headers,
        params: {
            query: `phone:"+${trimmedPhone}"`
        }
    }
    const { data: response } = await axios.get(`${BASE_URL}/customers/search.json`, config);
    return response;
}

const getOrderById = async (order_id) => {
    let config = {
        headers: headers,
        params: {
            fields: "id,financial_status,closed_at,cancelled_at,customer,fulfillment_status"
        }
    }
    const { data: response } = await axios.get(`${BASE_URL}/orders/${order_id}.json`, config);
    return response;
}

const getAbandonedCheckouts = async () => {
    const minDate = getTodayDate();
    let config = {
        headers: headers,
        params: {
            created_at_min: minDate,
            limit: 250
        }
    }
    const { data: response } = await axios.get(`${BASE_URL}/checkouts.json?created_at_min=2023-12-17&limit=250`, config);
    return response?.checkouts;
}

const getTodayDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = today.getMonth() + 1; // Months start at 0!
    const dd = today.getDate();

    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;

    return `${yyyy}-${mm}-${dd}`;
}

module.exports = { getOrderById, updateCustomerPhone, getCustomerByPhone, cancelOrder, getAbandonedCheckouts }