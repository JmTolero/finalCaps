const pool = require('../src/db/config');

/**
 * Check if system time matches database time
 * This script compares:
 * - Node.js system time
 * - MySQL database time
 * - Timezone settings
 */
async function checkTime() {
    try {
        console.log('🕒 Checking System Time vs Database Time...\n');
        
        // Get Node.js system time
        const nodeTime = new Date();
        console.log('📱 Node.js System Time:');
        console.log('   Local:', nodeTime.toString());
        console.log('   UTC:', nodeTime.toUTCString());
        console.log('   ISO:', nodeTime.toISOString());
        console.log('   Timezone Offset:', nodeTime.getTimezoneOffset(), 'minutes');
        console.log('   Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
        
        // Get MySQL database time
        const [dbTimeResult] = await pool.query('SELECT NOW() as db_time, @@session.time_zone as timezone, @@global.time_zone as global_timezone');
        const dbTime = dbTimeResult[0];
        
        console.log('\n🗄️  MySQL Database Time:');
        console.log('   Database Time:', dbTime.db_time);
        console.log('   Session Timezone:', dbTime.timezone);
        console.log('   Global Timezone:', dbTime.global_timezone);
        
        // Convert database time to Date object for comparison
        const dbDate = new Date(dbTime.db_time);
        console.log('   As Date Object:', dbDate.toString());
        console.log('   As UTC:', dbDate.toUTCString());
        console.log('   As ISO:', dbDate.toISOString());
        
        // Calculate time difference
        const timeDiff = Math.abs(nodeTime.getTime() - dbDate.getTime());
        const timeDiffSeconds = Math.floor(timeDiff / 1000);
        const timeDiffMinutes = Math.floor(timeDiffSeconds / 60);
        
        console.log('\n⚖️  Comparison:');
        console.log('   Time Difference:', timeDiffSeconds, 'seconds (' + timeDiffMinutes + ' minutes)');
        
        if (timeDiffSeconds < 5) {
            console.log('   ✅ Times are synchronized (within 5 seconds)');
        } else if (timeDiffSeconds < 60) {
            console.log('   ⚠️  Times are close but not perfectly synchronized');
        } else {
            console.log('   ❌ Times are significantly different!');
        }
        
        // Check timezone configuration
        console.log('\n🌍 Timezone Configuration:');
        const expectedTimezone = '+08:00'; // Philippine timezone
        if (dbTime.timezone === expectedTimezone || dbTime.timezone === 'SYSTEM') {
            console.log('   ✅ Database timezone is configured correctly');
        } else {
            console.log('   ⚠️  Database timezone:', dbTime.timezone, '(Expected:', expectedTimezone + ')');
        }
        
        // Get current time in Philippine timezone
        const phTime = new Date(nodeTime.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
        console.log('\n🇵🇭 Philippine Time (Asia/Manila):');
        console.log('   Current Time:', phTime.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
        
        // Check if database time matches Philippine time
        const dbTimeStr = dbDate.toLocaleString('en-US', { timeZone: 'Asia/Manila' });
        const phTimeStr = phTime.toLocaleString('en-US', { timeZone: 'Asia/Manila' });
        
        console.log('\n📊 Summary:');
        console.log('   Node.js Time:', nodeTime.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
        console.log('   Database Time:', dbTimeStr);
        console.log('   Expected (PH):', phTimeStr);
        
        if (dbTime.timezone === expectedTimezone || dbTime.timezone === 'SYSTEM') {
            console.log('\n✅ System time configuration appears correct!');
        } else {
            console.log('\n⚠️  Please verify timezone configuration in database.');
        }
        
    } catch (error) {
        console.error('❌ Error checking time:', error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

checkTime();

