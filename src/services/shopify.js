const axios = require('axios');

const headers = {
    'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
    'Content-Type': 'application/json'
};

export const updateCustomerPhone = async (customer) => {
    let data = {
        "customer": {
            "phone": `+${customer.note}`
        }
    };
    let config = {
        method: 'put',
        url: `https://${process.env.SHOPIFY_SHOP_NAME}.myshopify.com/admin/api/2023-04/customers/${customer.id}.json`,
        headers: headers,
        data: data
    };

    return await axios.request(config);
}


export const cancelOrder = async (order_id) => {

    return await axios.post(`https://${process.env.SHOPIFY_SHOP_NAME}.myshopify.com/admin/api/2023-04/orders/${order_id}/cancel.json`, {}, {
        headers: headers
    })
}

export const getCustomerByPhone = async (phone) => {
    let trimmedPhone = (phone).replace(/\s/g, "");
    trimmedPhone = trimmedPhone.replace("+", "");

    let config = {
        headers: headers,
        params: {
            query: `phone:"+${trimmedPhone}"`
        },
    }
    const { data: response } = await axios.get(`https://${process.env.SHOPIFY_SHOP_NAME}.myshopify.com/admin/api/2023-04/customers/search.json`, config);
    return response
}