const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const DailyHealthReview = require('../models/DailyHealthReview');
const User = require('../models/User');

// GET /api/daily-review/status
// Check if the user needs to write a review today (for yesterday)
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const now = new Date();
    // Use user's timezone if possible, but for now we rely on server/UTC consistency 
    // or we assume backend logic runs in a consistent timezone (e.g. IST as per prompt)
    // IMPORTANT: The prompt specifies IST rules. 
    // "reviewForDate: Date, // previous calendar day (IST)"
    
    // Helper to get normalized date (Start of Day in IST)
    const getISTDate = (date) => {
        const d = new Date(date);
        const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istDate = new Date(utc + istOffset);
        istDate.setHours(0, 0, 0, 0); // Normalize to midnight
        return istDate;
    };

    const todayIST = getISTDate(now);
    const yesterdayIST = new Date(todayIST);
    yesterdayIST.setDate(yesterdayIST.getDate() - 1);

    // RULE 1: User is NOT on their first day (At least one full calendar day passed)
    // if createdAt (normalized) == todayIST, then it's first day.
    const createdAtIST = getISTDate(user.createdAt);
    if (createdAtIST.getTime() >= todayIST.getTime()) {
        return res.json({ showReview: false, reason: "New user" });
    }

    // RULE 2: User was ACTIVE yesterday
    // If lastActive < yesterdayIST (start of yesterday), then they were NOT active yesterday.
    // They must have been active at least ONCE during yesterday (or today).
    // Actually, prompt says "User was ACTIVE yesterday (IST)". 
    // This typically means lastActive >= yesterdayIST && lastActive < todayIST (if STRICTLY yesterday)
    // Or just lastActive >= yesterdayIST (if active today, they were theoretically "active recently enough to remember yesterday"?)
    // Let's stick to strict "Active Yesterday" or "Active Today meaning they returned".
    // If I log in today, my lastActive is NOW. So lastActive >= yesterdayIST is satisfied.
    // Logic: If lastActive was updated TODAY, it implies they are back.
    // We want to ask about Yesterday.
    // If they were NOT active yesterday, we don't ask? "User was ACTIVE yesterday (IST)" -> This implies they used the app yesterday.
    // If they missed yesterday entirely, we SKIP.
    // Check if user.lastActive falls within Yesterday's 24h window?
    // OR does it mean "User has been active recently"?
    // "User was ACTIVE yesterday (IST)" implies they logged in yesterday.
    
    // Let's check if they have any activity logs for yesterday? 
    // Or just rely on `lastActive`? 
    // `lastActive` is a single timestamp of the LAST action.
    // If they use app today (8am), lastActive = Today 8am.
    // Did they use it yesterday? We assume YES if they are a regular user, but `lastActive` overwrites.
    // WE HAVE A PROBLEM: `lastActive` is overwritten. We can't know if they were active yesterday if they are active today.
    // UNLESS we check logs.
    // BUT: The prompt is "Implement a calm, optional Daily Health Review".
    // "User was ACTIVE yesterday" -> If they skipped yesterday, no review.
    // If they are active TODAY, we don't know if they were active yesterday.
    // However, if we assume the "User was ACTIVE yesterday" rule is to ensure they remember how they felt,
    // maybe we can relax it or infer it?
    // OR, we can only rely on `lastActive`.
    // If `lastActive` < yesterdayIST, then they heavily missed yesterday. -> SKIP.
    // If `lastActive` >= todayIST (active today), we technically don't know about yesterday.
    // Safe approach: If they are active today, we GIVE them the benefit of the doubt IF they haven't submitted yet?
    // "No backfilling of missed days." -> If they come back after 3 days, don't ask about 3 days ago.
    // If they come back Today, and missed Yesterday, do we ask about Yesterday?
    // "User was ACTIVE yesterday" condition suggests: ONLY show if they actually used the app yesterday.
    // Since we don't have a full activity log easily accessible here without querying heavy logs...
    // We might have to skip strict enforcement or use `lastActive`.
    // WAIT. If they are using the app RIGHT NOW to see this widget, they are active TODAY.
    // If they were NOT active yesterday, then `lastActive` (before this session update) would be < yesterdayIST.
    // But `authMiddleware` updates `lastActive` on every request!
    // So by the time this API is hit, `lastActive` is NOW.
    // FIX: We cannot check "Active Yesterday" using `lastActive` alone because it's already updated.
    // We would need to look at another signal or accept "Active Today" as proxy.
    // ALTERNATIVE: The prompt implies "Don't ask if they haven't been around".
    // If they log in today after a week, `lastActive` was 1 week ago (before update).
    // We can't see the "before update" value here easily unless we passed it or stored `previousLastActive`.
    // Let's assume for MVP: relying on "Active Yesterday" is hard. 
    // I will check if they have ANY logs (MedicineLog) from yesterday?
    // That's a better proxy.
    
    // "User was ACTIVE yesterday (IST)" -> Checked via MedicineLog updates or similar?
    // Let's do a quick check on MedicineLogs for yesterday.
    const activeYesterday = await hasActivityYesterday(userId, yesterdayIST, todayIST);
    
    // Strict Activity Check (Production Mode)
    if (!activeYesterday) {
         // If they were not active yesterday, we do NOT ask them to review it.
         // This satisfies the "User was ACTIVE yesterday" rule.
         return res.json({ showReview: false, reason: "Not active yesterday" });
    }
    // Force allow for testing if not reviewed
    // if (!activeYesterday) console.log("TEST MODE: Allowing inactive user"); 

    const rangeStart = new Date(yesterdayIST);
    const rangeEnd = new Date(yesterdayIST);
    rangeEnd.setDate(rangeEnd.getDate() + 1);

    console.log(`[DailyReview] Checking existence for User ${userId}`);
    console.log(`[DailyReview] Target Date (IST Midnight): ${yesterdayIST.toISOString()}`);
    console.log(`[DailyReview] Query Range: ${rangeStart.toISOString()} - ${rangeEnd.toISOString()}`);

    // RULE 3: User has NOT already submitted a review for that day
    // Use range query to be safe against minor offsets, though exact match should work
    const existingReview = await DailyHealthReview.findOne({
        userId,
        reviewForDate: { $gte: rangeStart, $lt: rangeEnd }
    });
    
    if (existingReview) {
        console.log(`[DailyReview] Found existing review: ${existingReview._id}`);
        return res.json({ showReview: false, reason: "Already reviewed" });
    } else {
        console.log(`[DailyReview] No review found.`);
    }

    // ELIGIBLE
    res.json({
        showReview: true,
        reviewForDate: yesterdayIST,
        formattedDate: yesterdayIST.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })
    });

  } catch (error) {
    console.error("Error checking review status:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/daily-review
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { mood, reviewText, reviewForDate } = req.body;
    const userId = req.user.id;

    if (!mood) {
        return res.status(400).json({ message: "Mood is required" });
    }

    // Double check date (Server Authority)
    // We force `reviewForDate` to be the server-calculated 'yesterday' to avoid client spoofing
    const getISTDate = (date) => {
        const d = new Date(date);
        const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istDate = new Date(utc + istOffset);
        istDate.setHours(0, 0, 0, 0); // Normalize to midnight
        return istDate;
    };
    const now = new Date();
    const todayIST = getISTDate(now);
    const yesterdayIST = new Date(todayIST);
    yesterdayIST.setDate(yesterdayIST.getDate() - 1);

    const rangeStart = new Date(yesterdayIST);
    const rangeEnd = new Date(yesterdayIST);
    rangeEnd.setDate(rangeEnd.getDate() + 1);

    // Check for duplicate again
    const existing = await DailyHealthReview.findOne({ 
        userId, 
        reviewForDate: { $gte: rangeStart, $lt: rangeEnd }
    });
    
    if (existing) {
        console.log(`[DailyReview POST] Duplicate detected for ${yesterdayIST.toISOString()}`);
        return res.status(409).json({ message: "Review already submitted for yesterday" });
    }

    console.log(`[DailyReview POST] Saving review for ${yesterdayIST.toISOString()}`);

    const newReview = new DailyHealthReview({
        userId,
        reviewForDate: yesterdayIST,
        mood,
        reviewText
    });

    await newReview.save();

    res.status(201).json({ message: "Review submitted successfully", review: newReview });

  } catch (error) {
    console.error("Error submitting review:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Helper functions
const MedicineLog = require('../models/MedicineLog');
const Report = require('../models/Report');

async function hasActivityYesterday(userId, start, end) {
    // Check logs
    const logCount = await MedicineLog.countDocuments({
        userId,
        updatedAt: { $gte: start, $lt: end }
    });
    if (logCount > 0) return true;

    // Check reports
    const reportCount = await Report.countDocuments({
        userId,
        createdAt: { $gte: start, $lt: end } 
    });
    if (reportCount > 0) return true;

    // If we wanted to be stricter, we'd need a SessionLog. 
    // For now, if they took medicine or uploaded report, they were active.
    // If they just opened the app and did nothing, we miss them. 
    // This aligns with "Passive/Calm" - if they didn't engage, we don't nag.
    return false;
}

module.exports = router;
