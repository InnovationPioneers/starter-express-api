const axios = require('axios');

const headers = {
    'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
    'Content-Type': 'application/json'
};

const SHOP = process.env.SHOPIFY_SHOP_NAME;
const BASE_URL = `https://${SHOP}.myshopify.com/admin/api/2023-04`;

const updateCustomerPhone = async (customer) => {
    let phone = `+${customer.note}`;
    let data = {
        "customer": {
            "phone": phone
        }
    };
    const result = await axios.put(
        `${BASE_URL}/customers/${customer.id}.json`, data,
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

module.exports = { getOrderById, updateCustomerPhone, getCustomerByPhone, cancelOrder }