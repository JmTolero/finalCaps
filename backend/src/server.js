const express = require("express")
const app = express()
const pool = require('../src/db/config')


app.listen(process.env.PORT, ()=>{
    console.log("listening")
})

app.get('/', (req, res)=>{
    res.json('Hello from backend')
})


app.get('/users', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM users');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});
    