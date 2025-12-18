const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { google } = require("googleapis");
const User = require("../models/User");
const { createOAuthClient, getAuthUrl } = require("../utils/googleCalendar");
const { sendOtpEmail } = require("../utils/email");

const JWT_SECRET = process.env.JWT_SECRET || "changeme"; // use existing secret

// GET /api/auth/google/url?mode=login|signup
router.get("/url", async (req, res) => {
  try {
    const mode = req.query.mode === "signup" ? "signup" : "login";
    const url = getAuthUrl(mode);
    if (!url) {
      return res
        .status(500)
        .json({ success: false, message: "Google OAuth is not configured." });
    }
    return res.json({ success: true, url });
  } catch (err) {
    console.error("Error generating Google login URL:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to generate Google login URL" });
  }
});

// GET /api/auth/google/callback?code=...&state=...
// This is for LOGIN/SIGNUP + calendar auto-connect
router.get("/callback", async (req, res) => {
  try {
    const { code, error, state } = req.query;
    const frontendBase = process.env.APP_BASE_URL || "https://meditrack-ultimate.vercel.app";

    if (error) {
      console.error("Google OAuth error:", error);
      return res.redirect(
        `${frontendBase}/login?googleError=${encodeURIComponent(error)}`
      );
    }

    if (!code) {
      return res.status(400).send("Missing authorization code.");
    }

    // Decode state to know if it's login or signup
    let mode = "login";
    if (state) {
      try {
        const parsed = JSON.parse(state);
        if (parsed.mode === "signup") mode = "signup";
      } catch (e) {
        console.warn("Failed to parse state:", state);
      }
    }

    const oAuth2Client = createOAuthClient();
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Get Google profile (email, name, picture)
    const oauth2 = google.oauth2({ auth: oAuth2Client, version: "v2" });
    const me = await oauth2.userinfo.get();

    const googleId = me.data.id;
    const googleEmail = (me.data.email || "").toLowerCase();
    const googleName = me.data.name || "";
    const googlePicture = me.data.picture || "";

    if (!googleEmail) {
      return res.redirect(
        `${frontendBase}/login?googleError=${encodeURIComponent(
          "Google account has no email"
        )}`
      );
    }

const cloudinary = require("../utils/cloudinary");

    // Find existing user by google.id OR email
    let user = await User.findOne({
      $or: [{ "google.id": googleId }, { email: googleEmail }],
    });

    // Helper to upload to Cloudinary
    let finalProfilePic = googlePicture;
    if (googlePicture) {
      try {
        const uploadRes = await cloudinary.uploader.upload(googlePicture, {
          folder: "meditrack/profiles",
          public_id: `google_${googleId}`,
          overwrite: true,
        });
        finalProfilePic = uploadRes.secure_url;
      } catch (uploadErr) {
        console.error("Failed to upload Google picture to Cloudinary:", uploadErr);
        // Fallback to original googlePicture URL
      }
    }

    if (mode === "login") {
      // LOGIN FLOW
      if (!user) {
        // No account yet -> redirect to signup page with message
        return res.redirect(
          `${frontendBase}/signup?googleAccountNotFound=true&email=${encodeURIComponent(
            googleEmail
          )}`
        );
      }

      // Ensure google fields & calendar are updated
      user.google = {
        id: googleId,
        email: googleEmail,
        accessToken: tokens.access_token || user.google?.accessToken || null,
        refreshToken: tokens.refresh_token || user.google?.refreshToken || null,
        calendarConnected: true,
      };

      // Always update profile picture on Google Login as requested
      if (finalProfilePic) {
        user.profilePictureUrl = finalProfilePic;
      }

      await user.save();

      // Verified -> issue JWT and redirect to dashboard
      const payload = { id: user._id };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

      const redirectUrl = `${frontendBase}/auth/google-success#token=${encodeURIComponent(
        token
      )}`;
      return res.redirect(redirectUrl);

    } else {
      // SIGNUP FLOW
      if (user) {
        // User already exists -> ask them to login instead
        return res.redirect(
          `${frontendBase}/login?googleAlreadyExists=true&email=${encodeURIComponent(
            user.email
          )}`
        );
      }

      // Create new user with Google data
      user = new User({
        name: googleName || googleEmail.split("@")[0],
        email: googleEmail,
        password: null, // no password for Google-only signup
        profilePictureUrl: googlePicture || null,
        isVerified: true, // Google verified email
      });

      user.google = {
        id: googleId,
        email: googleEmail,
        accessToken: tokens.access_token || null,
        refreshToken: tokens.refresh_token || null,
        calendarConnected: true,
      };

      await user.save();

      // Redirect to Login with success message
      return res.redirect(
        `${frontendBase}/login?googleSignupSuccess=true&email=${encodeURIComponent(
          user.email
        )}`
      );
    }

  } catch (err) {
    console.error("Error in Google auth callback:", err);
    const frontendBase = process.env.APP_BASE_URL || "https://meditrack-ultimate.vercel.app";
    return res.redirect(
      `${frontendBase}/login?googleError=${encodeURIComponent(
        "Failed to log in with Google"
      )}`
    );
  }
});

module.exports = router;
