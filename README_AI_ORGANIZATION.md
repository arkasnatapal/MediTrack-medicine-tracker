# AI Medicine Organization Feature

## Overview

The AI Medicine Organization feature automatically categorizes your medicines into folders based on their therapeutic indications using external drug databases and intelligent heuristics.

## Features

- **Automatic Categorization**: Medicines are automatically sorted into therapeutic categories (Pain Relief, Fever, Antibiotics, etc.)
- **External Drug Databases**: Uses OpenFDA and RxNorm APIs for accurate drug information
- **Smart Caching**: Lookups are cached for 90 days to minimize external API calls
- **Confidence Scoring**: Each categorization includes a confidence score
- **Manual Override**: Users can manually move medicines between folders
- **Privacy-Focused**: Users can see which sources were used and opt out of web lookups
- **Low-Confidence Warnings**: Items with low confidence are flagged for manual review

## How It Works

1. **Click "Organize with AI"** button on the My Medicines page
2. The system:
   - Normalizes medicine names (removes dosages, handles synonyms)
   - Checks the cache for existing lookups
   - Queries external APIs (OpenFDA → RxNorm → Web scraping fallback)
   - Categorizes medicines based on their indications
   - Creates folders for each category
3. **Review the results** in the preview modal
4. **Accept or reject** individual categorizations
5. Medicines are organized into folders

## Categories

The system supports 18 therapeutic categories:

- Pain Relief
- Fever
- Anti-inflammatory
- Antibiotic
- Antiviral
- Antifungal
- Digestive Health
- Nausea & Vomiting
- Allergy
- Respiratory
- Cardiovascular
- Diabetes
- Mental Health
- Vitamins & Supplements
- Skin Care
- Eye Care
- Hormonal
- Antacid
- Unsorted (for unrecognized medicines)

## API Endpoints

### POST `/api/medicines/organize`

Organize all medicines for the authenticated user.

**Request Body:**
```json
{
  "allowWebLookup": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Medicines organized successfully",
  "summary": {
    "totalMedicines": 10,
    "foldersCreated": [
      {
        "id": "folder_id",
        "name": "Pain Relief",
        "color": "#ef4444",
        "medicineCount": 3
      }
    ],
    "medicinesOrganized": [
      {
        "medicineId": "med_id",
        "medicineName": "Paracetamol 500mg",
        "oldFolders": [],
        "newFolders": ["Pain Relief", "Fever"],
        "confidence": 0.9,
        "source": "openfda"
      }
    ],
    "lowConfidenceItems": [],
    "sourcesUsed": ["openfda", "rxnorm"]
  }
}
```

### GET `/api/medicines/folders`

Get all folders for the authenticated user.

**Response:**
```json
{
  "success": true,
  "folders": [
    {
      "_id": "folder_id",
      "name": "Pain Relief",
      "color": "#ef4444",
      "medicineCount": 3,
      "isSystemGenerated": true,
      "createdAt": "2025-11-29T18:00:00.000Z"
    }
  ]
}
```

### POST `/api/medicines/:medicineId/move`

Move a medicine to different folders.

**Request Body:**
```json
{
  "folderIds": ["folder_id_1", "folder_id_2"]
}
```

### DELETE `/api/medicines/folders/:folderId`

Delete a folder (medicines are removed from the folder but not deleted).

### PUT `/api/medicines/lookup-cache/:normalizedName`

Manually update a cache entry.

**Request Body:**
```json
{
  "indications": ["pain relief", "fever reduction"],
  "categories": ["Pain Relief", "Fever"]
}
```

## Testing Locally

### Prerequisites

1. Node.js and npm installed
2. MongoDB running locally or connection string in `.env`
3. Backend and frontend servers running

### Test Script

Run the test script to verify the organization logic:

```bash
node backend/test-organization.js
```

### Manual Testing

1. **Add Sample Medicines:**
   - "Pan 40" (should be categorized as Digestive Health/Antacid)
   - "P 500" (should be categorized as Pain Relief/Fever)
   - "Amoxicillin 500mg" (should be categorized as Antibiotic)
   - "Lemonade" (should go to Unsorted)

2. **Click "Organize with AI"** on the My Medicines page

3. **Verify:**
   - Folders are created for each category
   - Medicines are assigned to appropriate folders
   - Low-confidence items are flagged
   - Sources used are displayed

4. **Test Manual Override:**
   - Move a medicine to a different folder
   - Verify it stays in the new folder after re-organizing

### Edge Cases to Test

- **Duplicate Names**: Add "Paracetamol", "Pan", "P 500" - should all be normalized to the same medicine
- **Combination Medicines**: "Cefixime + Ofloxacin" - should be categorized as Antibiotic
- **Special Characters**: "Pan-40", "P/500" - should handle punctuation
- **Unknown Medicines**: "XYZ123" - should go to Unsorted folder
- **No Medicines**: Organize with no medicines - should return empty result

## Configuration

### API Keys

Currently, the feature uses free public APIs that don't require API keys:

- **OpenFDA**: No API key required (rate limit: 240/minute, 120,000/day)
- **RxNorm**: No API key required (rate limit: 20/minute)

If you want to add premium drug databases, update `backend/utils/drugLookupService.js`:

```javascript
// Add your API key
const PREMIUM_API_KEY = process.env.DRUG_API_KEY;

// Add new lookup function
async function lookupPremiumDB(drugName) {
  // Your implementation
}

// Add to lookup chain
const lookupChain = [
  { name: 'premium', fn: lookupPremiumDB },
  { name: 'openfda', fn: lookupOpenFDA },
  // ...
];
```

### Rate Limits

Adjust rate limits in `backend/utils/drugLookupService.js`:

```javascript
const RATE_LIMITS = {
  openfda: { maxPerMinute: 240, maxPerDay: 120000 },
  rxnorm: { maxPerMinute: 20 },
  webscrape: { maxPerMinute: 5 },
};
```

### Cache TTL

Adjust cache expiration in `backend/models/MedicineLookupCache.js`:

```javascript
expiresAt: {
  type: Date,
  default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
}
```

### Add More Categories

Add new categories in `backend/utils/medicineCategorizationService.js`:

```javascript
const CATEGORY_MAPPINGS = {
  'Your Category': {
    keywords: ['keyword1', 'keyword2'],
    color: '#hexcolor',
  },
  // ...
};
```

## Privacy & Data Handling

### What Data is Sent?

- **Medicine names** are sent to external APIs (OpenFDA, RxNorm)
- **No personal information** (user data, dosages, quantities) is sent
- Only normalized medicine names are transmitted

### Opt-Out

Users can opt out of external lookups by setting `allowWebLookup: false`:

```javascript
const response = await axios.post(
  '/api/medicines/organize',
  { allowWebLookup: false }
);
```

This will use only local heuristics for categorization.

### Data Retention

- **Cache entries** expire after 90 days
- **Manual overrides** never expire
- **Folder assignments** are stored permanently until changed

## Troubleshooting

### Issue: "Rate limit exceeded"

**Solution**: The system implements exponential backoff. Wait a few minutes and try again. For large medicine collections, consider:
- Reducing the number of medicines
- Running organization in batches
- Increasing rate limits (if using premium APIs)

### Issue: "All medicines go to Unsorted"

**Solution**: This usually means:
- External APIs are down or rate-limited
- Medicine names are too generic or misspelled
- Try enabling web lookups: `allowWebLookup: true`

### Issue: "Low confidence for all items"

**Solution**: 
- Check if medicine names are properly formatted
- Verify external APIs are responding
- Consider adding manual overrides for common medicines

### Issue: "Duplicate folders created"

**Solution**: This shouldn't happen due to unique index on `userId + name`. If it does:
```javascript
// Run this in MongoDB shell to remove duplicates
db.medicinefolders.aggregate([
  { $group: { _id: { userId: "$userId", name: "$name" }, count: { $sum: 1 }, docs: { $push: "$_id" } } },
  { $match: { count: { $gt: 1 } } }
])
```

## Performance Optimization

### Bulk Operations

The system uses MongoDB bulk operations for efficiency:

```javascript
await Medicine.bulkWrite(bulkOps);
```

### Caching Strategy

- **First run**: Lookups are performed and cached
- **Subsequent runs**: Cache is used, no external calls
- **Cache expiry**: After 90 days, lookups are refreshed

### Rate Limiting

- Small delays (100ms) between lookups to respect rate limits
- Exponential backoff for failed requests
- Request counters reset every minute

## Future Enhancements

- [ ] Background job processing for large collections
- [ ] Real-time progress updates via WebSockets
- [ ] Folder sharing between family members
- [ ] AI-powered dosage recommendations
- [ ] Integration with pharmacy databases
- [ ] Multi-language support for medicine names
- [ ] Barcode scanning for automatic medicine addition

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the console logs for detailed error messages
3. Verify MongoDB indexes are created: `db.medicinelookup caches.getIndexes()`
4. Check API rate limits and quotas

## License

This feature is part of the MediTrack application.
