const express = require('express')
const router = express.Router();
const userController = require('../controller/userController')


router.post('/login', userController.userLogin);
router.get('/api/total',userController.countTotal);
module.exports = router;