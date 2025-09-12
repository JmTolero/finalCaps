const pool  = require("../../db/config")


const getOrderRecords = async () => {
        const [rows] = await pool.query(`
                select 
                o.order_id, 
                u.fname, 
                v.store_name, 
                cd.size, 
                o.status, 
                o.payment_status, 
                o.delivery_datetime,
                ds.status_name
                from orders as o
                inner join order_items as oi on o.order_id = oi.order_id
                inner join users as u on o.customer_id = u.user_id
                inner join vendors as v on o.vendor_id = v.vendor_id
                inner join container_drum as cd on oi.containerDrum_id = cd.drum_id
                inner join drum_stats as ds on ds.drum_status_id = oi.drum_status_id
            `)
            return rows;
    }


module.exports = {getOrderRecords};