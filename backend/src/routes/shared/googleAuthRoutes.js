const express = require('express');
const passport = require('passport');
const router = express.Router();
const googleAuthController = require('../../controller/shared/googleAuthController');

// Google OAuth routes
router.get(
    '/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        prompt: 'select_account',
        session: false
    })
);

router.get('/google/callback',
    passport.authenticate('google', { 
        failureRedirect: '/api/auth/google/failure',
        session: false 
    }),
    googleAuthController.googleAuthSuccess
);

router.get('/google/failure', googleAuthController.googleAuthFailure);

router.post('/google/logout', googleAuthController.googleLogout);

module.exports = router;
