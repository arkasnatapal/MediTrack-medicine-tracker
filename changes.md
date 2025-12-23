# Health Intelligence System Upgrade

## 1. Domain-Based Intelligence (Previous Update)
- Insights are split by domain (e.g., Cardiology, Glucose).
- Adherence logic is isolated and rule-based.
- Quota: AI only runs on NEW reports per domain.

## 2. Future Health Prediction (Upgrade)
- A **separate, derived layer** that sits above the domain insights.
- **Goal**: Predict future trajectory (Next 7-14 days) using *current stable insights*.
- **Trigger Rule**:
  - The Future Prediction AI is called **IF AND ONLY IF**:
    1. At least one domain insight was updated (New report content).
    2. OR Medication Adherence score changed significantly (> 5%).
    3. OR No previous prediction exists.
  - If data is stable, the **previous prediction is reused** (0 AI Tokens).

### Explainability
- The system now stores a `predictionBasis` array.
- This is displayed in the UI as "Prediction Basis", showing exactly which domains (e.g. "Glucose (Stable)") and adherence data contributed to the prediction.

## 3. Quota Optimization (User Request)
- **Automatic Refresh**: Restricted to once every **24 hours** (previously 5 minutes) to save AI credits.
- **Manual Refresh**: Users can still trigger an immediate update via the "Refresh" button in the panel.

## 4. Daily Health Review (New Feature)
- **Goal**: Collect subjective patient feedback ("How did you feel yesterday?").
- **Visibility**:
  - Only shown if user was active yesterday.
  - Not shown for new users (first day).
  - One review per day max.
- **Intelligence Integration**:
  - Reviews are processed as **subjective context**.
  - They generate a "Self-Reported Trend" (Improving/Stable/Declining).
  - **Crucially**: They do NOT cause medical reports to be re-analyzed.

## 5. Bug Fixes
- Fixed `ReferenceError: mimeType` in OCR route.
- Fixed `SyntaxError` (missing braces and commas) in Controller and Scheme files.

## Verification Checklist
- [x] **Stability**: Refreshing without new data does NOT trigger new prediction generation.
- [x] **Separation**: Future prediction is a distinct visual layer from Domain Cards.
- [x] **Transparency**: Users can see *why* a prediction was made via the "Prediction Basis" sidebar.
- [x] **Rate Limiting**: Automatic AI calls limited to 24h interval.
- [x] **Daily Review**: Widget appears correctly for active users, handles duplicates gracefully.
