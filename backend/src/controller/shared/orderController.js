// const pool = require ('../../db/config')

const Orders = require('../../model/shared/orderModel');



const getOrderRecord = async (req, res) => {
    try{
        const rows = await Orders.getOrderRecords();
        res.json(rows) 
    }catch(err){
        console.log(err);
        res.status(500).json({error:"Orders Record admin error"})
    }
}

module.exports = {getOrderRecord};