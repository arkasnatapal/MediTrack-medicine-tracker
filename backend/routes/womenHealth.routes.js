const express = require('express');
const router = express.Router();
const WomenHealth = require('../models/WomenHealth.model');
const { encryptWomenHealth, decryptWomenHealth } = require('../utils/womenHealthCrypto');
const womenHealthAccess = require('../middleware/womenHealthAccess');
const { analyzeHealth, analyzePeriodOutcome } = require('../services/womenHealthAI.service');
const protect = require('../middleware/authMiddleware'); // Standard auth

// Apply middlewares
router.use(protect);
router.use(womenHealthAccess);

// Helper to get hash from env
const getSecret = () => process.env.WOMEN_HEALTH_HASH;

// GET /api/women-health/:userId
router.get('/:userId', async (req, res) => {
    try {
        if (req.user.id !== req.params.userId) {
            return res.status(403).json({ message: 'Unauthorized access to this data' });
        }

        const healthRecord = await WomenHealth.findOne({ userId: req.params.userId });
        
        if (!healthRecord) {
            return res.status(200).json({ data: null });
        }

        // Decrypt
        const decryptedData = decryptWomenHealth(healthRecord.encryptedBlob, getSecret());
        
        let aiAnalysis = { ...decryptedData.cachedAIResponse };
        const now = new Date();

        // CHECK: Is it time to analyze? (Delayed Analysis Logic)
        // Rule: Only analyze if 'toBeAnalyzedAt' exists AND has passed.
        // Also ensure we don't re-run if we just did it (though cachedAIResponse usually handles this, 
        // strictly checking relative to 'toBeAnalyzedAt' ensures "Run Once" for this specific scheduled event).
        const timeToAnalyze = healthRecord.toBeAnalyzedAt ? new Date(healthRecord.toBeAnalyzedAt) : null;
        const lastRun = decryptedData.lastAnalysisTime ? new Date(decryptedData.lastAnalysisTime) : new Date(0);

        if ((timeToAnalyze && now >= timeToAnalyze && lastRun < timeToAnalyze) || req.query.force === 'true') {
            console.log("Running Scheduled (or Forced) Analysis for WomenHealth...");
            
            // AI Analysis with Context & Cache
            // We pass 'null' for lastAnalysisTime to force a fresh run since we determined it IS time.
            const freshAnalysis = await analyzeHealth(
                decryptedData, 
                req.user.id, 
                null, 
                null
            );

            // Save Cache
            const { phase, cycleDay, status, isCached, ...aiOnly } = freshAnalysis;
            
            // Explicitly ensure timestamp is inside cached response
            aiOnly.analysisTimestamp = freshAnalysis.analysisTimestamp;

            decryptedData.cachedAIResponse = aiOnly;
            decryptedData.lastAnalysisTime = freshAnalysis.analysisTimestamp;

            // Encrypt & Update DB
            // We do NOT clear toBeAnalyzedAt, keeping it as the record of "when this cycle was triggered".
            // The condition (lastRun < timeToAnalyze) prevents loop.
            const encryptedBlob = encryptWomenHealth(decryptedData, getSecret());
            await WomenHealth.findOneAndUpdate(
                { userId: req.params.userId },
                { encryptedBlob, lastUpdated: Date.now() }
            );

            aiAnalysis = freshAnalysis;
        } else {
             // Not time yet, or already done.
             // If AI analysis is missing entirely (new user), we might want a fast initial one?
             // Prompt implies rigorous "24 hour" rule. But for empty, maybe ok?
             // Lets stick to "If cached exists, use it". 
             if (!aiAnalysis) aiAnalysis = { summary: "Analysis pending next scheduled cycle." };
        }

        // Filter Feedback for Today
        const startOfToday = new Date();
        startOfToday.setHours(0,0,0,0);
        
        const feedbackGivenToday = (decryptedData.feedbackLogs || [])
            .filter(log => new Date(log.date) >= startOfToday)
            .map(log => log.exercise);

        res.json({
            data: decryptedData,
            analysis: aiAnalysis,
            lastUpdated: healthRecord.lastUpdated,
            toBeAnalyzedAt: healthRecord.toBeAnalyzedAt,
            feedbackGivenToday // Send list of exercise names rated today
        });
    } catch (error) {
        console.error('WomenHealth GET Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/women-health/:userId/log
router.post('/:userId/log', async (req, res) => {
    try {
        if (req.user.id !== req.params.userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const { logDate, symptoms, mood, flow, pain, notes, painAreas, energyLevel } = req.body;
        
        let healthRecord = await WomenHealth.findOne({ userId: req.params.userId });
        let data = healthRecord ? decryptWomenHealth(healthRecord.encryptedBlob, getSecret()) : { cycleData: {}, dailyLogs: [] };
        
        // Append Log
        if (!data.dailyLogs) data.dailyLogs = [];

        // Check for 24-hour lockout
        if (data.dailyLogs.length > 0) {
            const lastLog = data.dailyLogs[data.dailyLogs.length - 1];
            const lastLogTime = new Date(lastLog.date).getTime();
            const nowTime = new Date().getTime();
            const twentyFourHours = 24 * 60 * 60 * 1000;

            if (nowTime - lastLogTime < twentyFourHours) {
                const remainingTime = twentyFourHours - (nowTime - lastLogTime);
                const hours = Math.floor(remainingTime / (1000 * 60 * 60));
                const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
                return res.status(403).json({ 
                    message: `Daily check-in is available in ${hours}h ${minutes}m`,
                    nextAvailable: new Date(lastLogTime + twentyFourHours)
                });
            }
        }

        const newLogDate = logDate || new Date();
        data.dailyLogs.push({ date: newLogDate, symptoms, mood, flow, pain, notes, painAreas, energy: energyLevel });

        // Calculate Schedule
        const nextAnalysisDate = new Date(newLogDate);
        nextAnalysisDate.setDate(nextAnalysisDate.getDate() + 1); // +24h

        // Encrypt & Save
        const encryptedBlob = encryptWomenHealth(data, getSecret());
        await WomenHealth.findOneAndUpdate(
            { userId: req.params.userId },
            { 
                encryptedBlob, 
                lastUpdated: Date.now(),
                lastLogDate: newLogDate,
                toBeAnalyzedAt: nextAnalysisDate
            },
            { upsert: true }
        );

        res.json({ message: 'Daily log saved. Analysis scheduled for 24h later.' });
    } catch (error) {
        console.error('Log Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/women-health/:userId/estimate-date
router.post('/:userId/estimate-date', async (req, res) => {
    try {
        if (req.user.id !== req.params.userId) return res.status(403).json({ message: 'Unauthorized' });
        const { date } = req.body;
        
        let healthRecord = await WomenHealth.findOne({ userId: req.params.userId });
        let data = healthRecord ? decryptWomenHealth(healthRecord.encryptedBlob, getSecret()) : { cycleData: {} };

        // Store estimate
        data.cycleData = { ...data.cycleData, nextEstimatedStartDate: date };

        const encryptedBlob = encryptWomenHealth(data, getSecret());
        await WomenHealth.findOneAndUpdate(
            { userId: req.params.userId },
            { encryptedBlob, lastUpdated: Date.now() },
            { upsert: true }
        );
        res.json({ message: 'Estimate updated' });
    } catch (error) {
        console.error('Estimate Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/women-health/:userId/cycle-start-confirm
router.post('/:userId/cycle-start-confirm', async (req, res) => {
    try {
        if (req.user.id !== req.params.userId) return res.status(403).json({ message: 'Unauthorized' });
        
        const startDate = new Date().toISOString(); // Today is the day

        let healthRecord = await WomenHealth.findOne({ userId: req.params.userId });
        let data = healthRecord ? decryptWomenHealth(healthRecord.encryptedBlob, getSecret()) : { cycleData: {} };

        // 1. Calculate Length of Previous Cycle (if exists) & Archive if needed
        let cycleLength = 28; // Default
        if (data.cycleData?.lastPeriodStart) {
            const prevStart = new Date(data.cycleData.lastPeriodStart);
            const currentStart = new Date(startDate);
            const diffTime = Math.abs(currentStart - prevStart);
            cycleLength = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Auto-Archive Logic: If the user forgot to click "Stop", we must save the previous period
            // to history before overwriting 'lastPeriodStart'.
            const alreadyInHistory = data.history?.some(h => new Date(h.start).getTime() === prevStart.getTime());
            
            if (!alreadyInHistory) {
                if (!data.history) data.history = [];
                // Assume a standard 5-day period if they forgot to stop
                const assumedEnd = new Date(prevStart);
                assumedEnd.setDate(assumedEnd.getDate() + 5);
                
                data.history.push({
                    start: data.cycleData.lastPeriodStart,
                    end: assumedEnd.toISOString(),
                    cycleLength: cycleLength,
                    analysis: { summary: "Auto-archived (User forgot to stop)" }
                });
            }
        }

        // 2. Set Active State
        data.cycleData = {
            ...data.cycleData,
            lastPeriodStart: startDate,
            cycleLength: cycleLength,
            isPeriodActive: true, // Bleeding started
            nextEstimatedStartDate: null // Reset estimate
        };

        const encryptedBlob = encryptWomenHealth(data, getSecret());
        await WomenHealth.findOneAndUpdate(
            { userId: req.params.userId },
            { encryptedBlob, lastUpdated: Date.now() },
            { upsert: true }
        );
        res.json({ message: 'Cycle started', cycleLength });
    } catch (error) {
        console.error('Start Confirm Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/women-health/:userId/cycle-stop
router.post('/:userId/cycle-stop', async (req, res) => {
    try {
        if (req.user.id !== req.params.userId) return res.status(403).json({ message: 'Unauthorized' });

        let healthRecord = await WomenHealth.findOne({ userId: req.params.userId });
        let data = healthRecord ? decryptWomenHealth(healthRecord.encryptedBlob, getSecret()) : {};

        const endDate = new Date().toISOString();
        const startDate = data.cycleData?.lastPeriodStart;
        
        // 1. Generate Deep Analysis
        let periodAnalysis = {};
        if (startDate) {
            // Collect logs during this period
            const logs = data.dailyLogs?.filter(l => new Date(l.date) >= new Date(startDate)) || [];
            
            // Trigger AI Analysis
            periodAnalysis = await analyzePeriodOutcome(logs, data.cycleData?.cycleLength || 28, data.history);
        }

        // 2. Archive
        if (!data.history) data.history = [];
        data.history.push({
            start: startDate,
            end: endDate,
            analysis: periodAnalysis,
            cycleLength: data.cycleData?.cycleLength
        });

        // 3. Update State & Set Prediction
        data.cycleData.isPeriodActive = false; // Bleeding stopped
        
        // Auto-predict next start date
        // Logic: Start Date + Cycle Length (min 28)
        const currentCycleLength = data.cycleData?.cycleLength || 28;
        const effectiveLength = Math.max(currentCycleLength, 28);
        const nextDate = new Date(startDate);
        nextDate.setDate(nextDate.getDate() + effectiveLength);
        
        data.cycleData.nextEstimatedStartDate = nextDate.toISOString();

        const encryptedBlob = encryptWomenHealth(data, getSecret());
        await WomenHealth.findOneAndUpdate(
            { userId: req.params.userId },
            { encryptedBlob, lastUpdated: Date.now() },
            { upsert: true }
        );
        res.json({ message: 'Cycle stopped & Analyzed' });
    } catch (error) {
        console.error('Stop Confirm Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/women-health/:userId/history/:index
router.delete('/:userId/history/:index', async (req, res) => {
    try {
        if (req.user.id !== req.params.userId) return res.status(403).json({ message: 'Unauthorized' });
        
        const index = parseInt(req.params.index);
        let healthRecord = await WomenHealth.findOne({ userId: req.params.userId });
        
        if (!healthRecord) return res.status(404).json({ message: 'Record not found' });
        
        let data = decryptWomenHealth(healthRecord.encryptedBlob, getSecret());

        if (data.history && data.history[index]) {
            data.history.splice(index, 1);
            
            const encryptedBlob = encryptWomenHealth(data, getSecret());
            await WomenHealth.findOneAndUpdate(
                { userId: req.params.userId },
                { encryptedBlob, lastUpdated: Date.now() }
            );
            res.json({ message: 'History record deleted' });
        } else {
            res.status(404).json({ message: 'History item not found' });
        }
    } catch (error) {
        console.error('Delete History Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/women-health/feedback
router.post('/feedback', async (req, res) => {
    try {
        const { exerciseName, rating } = req.body;
        
        const healthRecord = await WomenHealth.findOne({ userId: req.user.id });
        if (!healthRecord) {
            return res.status(404).json({ message: 'Record not found' });
        }

        // Decrypt
        let data = decryptWomenHealth(healthRecord.encryptedBlob, getSecret());
        
        // Add to Feedback Logs (Initialize if missing)
        if (!data.feedbackLogs) data.feedbackLogs = [];
        
        data.feedbackLogs.push({
            date: new Date().toISOString(),
            exercise: exerciseName,
            rating: rating // 'helped', 'neutral', 'didnt_help'
        });

        // Keep only last 100 feedback items to prevent bloat
        if (data.feedbackLogs.length > 100) {
            data.feedbackLogs = data.feedbackLogs.slice(-100);
        }

        // Encrypt & Save
        healthRecord.encryptedBlob = encryptWomenHealth(data, getSecret());
        healthRecord.lastUpdated = Date.now();
        await healthRecord.save();

        res.status(200).json({ message: 'Feedback stored' });
    } catch (error) {
        console.error("Feedback Log Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
