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
        return await axios.post(`${BASE_URL}/orders/${order_id}/cancel.json`, {
            email: true
        }, {
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
            query: `phone:"+${trimmedPhone}"`,
            fields: "last_order_id,id,phone,email"
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

const getCustomerCODOrders = async (customer) => {
    let date = getYesterdayDate();
    let config = {
        headers: headers,
        params: {
            status: "open",
            created_at_min: date,
            fields: "id,payment_gateway_names,created_at"
        }
    }
    const { data: response } = await axios.get(`${BASE_URL}/customers/${customer.id}/orders.json`, config);
    const order = response.orders.find((order) => {
        return order.payment_gateway_names[0] == "Cash on Delivery (COD)"
    });

    return order;
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
    const { data: response } = await axios.get(`${BASE_URL}/checkouts.json`, config);
    return response?.checkouts;
}

const getTodayDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    let mm = today.getMonth() + 1; // Months start at 0!
    let dd = today.getDate();

    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;

    return `${yyyy}-${mm}-${dd}`;
}

const getYesterdayDate = () => {
    let date = new Date();
    const offset = date.getTimezoneOffset()
    date = new Date(date.getTime() - (offset * 60 * 1000))
    return date.toISOString().split('T')[0]
}

module.exports = { getOrderById, updateCustomerPhone, getCustomerByPhone, cancelOrder, getAbandonedCheckouts, getCustomerCODOrders }