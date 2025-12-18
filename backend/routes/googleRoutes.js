const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const User = require("../models/User");
const { google } = require("googleapis");
const { getAuthUrl, createOAuthClient } = require("../utils/googleCalendar");

// GET /api/google/oauth2/callback - handle redirect from Google
router.get("/oauth2/callback", (req, res) => {
  const { code } = req.query;
  // Redirect to frontend settings page with the code
  const baseUrl = process.env.APP_BASE_URL || "https://meditrack-ultimate.vercel.app";
  res.redirect(`${baseUrl}/settings?code=${code}`);
});

// GET /api/google/oauth2/url - get consent screen URL
router.get("/oauth2/url", auth, async (req, res) => {
  try {
    const url = getAuthUrl();
    if (!url) {
      return res.status(500).json({
        success: false,
        message: "Google OAuth is not configured on the server.",
      });
    }
    res.json({ success: true, url });
  } catch (err) {
    console.error("Error generating Google auth URL:", err);
    res.status(500).json({ success: false, message: "Failed to generate auth URL" });
  }
});

// POST /api/google/oauth2/exchange - exchange code for tokens
router.post("/oauth2/exchange", auth, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res
        .status(400)
        .json({ success: false, message: "Missing authorization code" });
    }

    const oAuth2Client = createOAuthClient();
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    // We already know the app user's email; no need to call Google userinfo.
    // Just store tokens and mark calendar as connected.
    user.google = {
      id: user.google?.id || null, // keep old if any, otherwise null
      email: user.email,           // use our app email
      accessToken: tokens.access_token || user.google?.accessToken || null,
      refreshToken: tokens.refresh_token || user.google?.refreshToken || null,
      calendarConnected: true,
    };

    await user.save();

    return res.json({
      success: true,
      message: "Google Calendar connected successfully",
      googleEmail: user.google.email,
    });
  } catch (err) {
    console.error("Error exchanging Google OAuth code:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to connect Google Calendar" });
  }
});

// POST /api/google/disconnect
router.post("/disconnect", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    user.google = {
      id: null,
      email: null,
      accessToken: null,
      refreshToken: null,
      calendarConnected: false,
    };

    await user.save();
    res.json({ success: true, message: "Google Calendar disconnected" });
  } catch (err) {
    console.error("Error disconnecting Google:", err);
    res.status(500).json({ success: false, message: "Failed to disconnect Google" });
  }
});

module.exports = router;
