/**
 * Medicine Organization Controller
 * Handles AI-powered medicine organization into folders
 */

const Medicine = require('../models/Medicine');
const MedicineFolder = require('../models/MedicineFolder');
const MedicineLookupCache = require('../models/MedicineLookupCache');
const { normalizeMedicineName, extractMedicineComponents } = require('../utils/medicineNormalizer');
const { lookupDrugIndications } = require('../utils/drugLookupService');
const { categorizeMedicine, getCategoryColor } = require('../utils/medicineCategorizationService');
const { createNotification } = require('../utils/notifications');

/**
 * Main organization function
 * POST /api/medicines/organize
 */
exports.organizeMedicines = async (req, res) => {
  try {
    const userId = req.user._id;
    const { allowWebLookup = true, force = false } = req.body;

    console.log(`Starting medicine organization for user ${userId}`);

    // 1. Fetch all user medicines
    const medicines = await Medicine.find({ 
      userId,
      patientType: { $ne: 'family' }
    });

    if (medicines.length === 0) {
      return res.json({
        success: true,
        message: 'No medicines to organize',
        summary: {
          totalMedicines: 0,
          foldersCreated: [],
          medicinesOrganized: [],
          lowConfidenceItems: [],
          alreadyOrganized: false,
        },
      });
    }

    console.log(`Found ${medicines.length} medicines to organize`);

    // 2. Check if medicines are already organized (duplicate detection)
    if (!force) {
      const organizedMedicines = medicines.filter(m => 
        m.organizationMetadata && m.organizationMetadata.categorizedAt
      );

      if (organizedMedicines.length === medicines.length) {
        const lastOrganizedDate = Math.max(...organizedMedicines.map(m => 
          new Date(m.organizationMetadata.categorizedAt).getTime()
        ));

        const existingFolders = await MedicineFolder.find({ userId });
        
        // Count medicines in each folder
        const foldersWithCounts = await Promise.all(
          existingFolders.map(async (folder) => {
            const count = await Medicine.countDocuments({
              userId,
              folders: folder._id,
            });
            return {
              id: folder._id,
              name: folder.name,
              color: folder.color,
              medicineCount: count,
            };
          })
        );
        
        return res.json({
          success: true,
          message: 'Medicines are already organized. No changes detected.',
          summary: {
            totalMedicines: medicines.length,
            foldersCreated: foldersWithCounts,
            medicinesOrganized: [],
            lowConfidenceItems: [],
            alreadyOrganized: true,
            lastOrganizedAt: new Date(lastOrganizedDate),
          },
        });
      }
    }

    // 3. Group medicines by normalized name
    const medicineGroups = new Map();
    const lookupResults = new Map();

    for (const medicine of medicines) {
      const normalizedName = normalizeMedicineName(medicine.name);
      
      if (!normalizedName) {
        console.log(`Skipping medicine with empty normalized name: ${medicine.name}`);
        continue;
      }

      if (!medicineGroups.has(normalizedName)) {
        medicineGroups.set(normalizedName, []);
      }
      medicineGroups.get(normalizedName).push(medicine);
    }

    console.log(`Grouped into ${medicineGroups.size} unique medicine names`);

    // 4. Lookup indications for each unique medicine
    for (const [normalizedName, meds] of medicineGroups.entries()) {
      let cacheEntry = await MedicineLookupCache.findOne({ normalizedName });

      if (cacheEntry) {
        console.log(`Cache hit for ${normalizedName}`);
        
        const categories = cacheEntry.categories.map(catName => ({
          category: catName,
          confidence: cacheEntry.confidence,
          color: getCategoryColor(catName),
        }));

        lookupResults.set(normalizedName, {
          indications: cacheEntry.indications,
          categories,
          source: cacheEntry.source,
          confidence: cacheEntry.confidence,
          fromCache: true,
        });
        continue;
      }

      console.log(`Cache miss for ${normalizedName}, looking up...`);
      
      let lookupResult;
      if (allowWebLookup) {
        lookupResult = await lookupDrugIndications(normalizedName);
      } else {
        lookupResult = {
          indications: [],
          source: 'heuristic',
          confidence: 0.1,
        };
      }

      const categories = categorizeMedicine(lookupResult.indications);

      await MedicineLookupCache.create({
        normalizedName,
        originalNames: meds.map(m => m.name),
        indications: lookupResult.indications,
        categories: categories.map(c => c.category),
        source: lookupResult.source,
        confidence: lookupResult.confidence,
      });

      lookupResults.set(normalizedName, {
        indications: lookupResult.indications,
        categories,
        source: lookupResult.source,
        confidence: lookupResult.confidence,
        fromCache: false,
      });

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 5. Create or find folders and assign medicines
    const folderMap = new Map();
    const medicineUpdates = [];
    const lowConfidenceItems = [];

    const existingFolders = await MedicineFolder.find({ userId });
    existingFolders.forEach(folder => {
      folderMap.set(folder.name, folder);
    });

    for (const [normalizedName, meds] of medicineGroups.entries()) {
      const lookup = lookupResults.get(normalizedName);
      
      if (!lookup) continue;

      const categories = lookup.categories;
      const folderIds = [];

      for (const categoryInfo of categories) {
        const categoryName = categoryInfo.category;
        
        let folder = folderMap.get(categoryName);
        
        if (!folder) {
          folder = await MedicineFolder.create({
            userId,
            name: categoryName,
            color: categoryInfo.color,
            isSystemGenerated: true,
          });
          folderMap.set(categoryName, folder);
          console.log(`Created folder: ${categoryName}`);
        }

        folderIds.push(folder._id);
      }

      for (const medicine of meds) {
        medicineUpdates.push({
          medicineId: medicine._id,
          medicineName: medicine.name,
          oldFolders: medicine.folders || [],
          newFolders: folderIds,
          categories: categories.map(c => c.category),
          source: lookup.source,
          confidence: lookup.confidence,
        });

        if (lookup.confidence < 0.5) {
          lowConfidenceItems.push({
            medicineId: medicine._id,
            medicineName: medicine.name,
            categories: categories.map(c => c.category),
            confidence: lookup.confidence,
            source: lookup.source,
            indications: lookup.indications,
          });
        }
      }
    }

    // 6. Bulk update medicines
    const bulkOps = medicineUpdates.map(update => ({
      updateOne: {
        filter: { _id: update.medicineId },
        update: {
          $set: {
            folders: update.newFolders,
            organizationMetadata: {
              source: update.source,
              confidence: update.confidence,
              categorizedAt: new Date(),
              isManual: false,
            },
          },
        },
      },
    }));

    if (bulkOps.length > 0) {
      const result = await Medicine.bulkWrite(bulkOps);
      console.log(`Bulk update result: ${result.modifiedCount} medicines updated`);
    }

    // 7. Create notification
    await createNotification({
      userId,
      type: 'general',
      title: 'Medicines organized',
      message: `Successfully organized ${medicines.length} medicines into ${folderMap.size} folders.`,
      severity: 'success',
    });

    // 8. Prepare response
    const foldersCreated = Array.from(folderMap.values()).map(folder => ({
      id: folder._id,
      name: folder.name,
      color: folder.color,
      medicineCount: medicineUpdates.filter(u => 
        u.newFolders.some(fid => fid.toString() === folder._id.toString())
      ).length,
    }));

    const medicinesOrganized = medicineUpdates.map(update => ({
      medicineId: update.medicineId,
      medicineName: update.medicineName,
      oldFolders: update.oldFolders,
      newFolders: update.categories,
      confidence: update.confidence,
      source: update.source,
    }));

    res.json({
      success: true,
      message: 'Medicines organized successfully',
      summary: {
        totalMedicines: medicines.length,
        foldersCreated,
        medicinesOrganized,
        lowConfidenceItems,
        sourcesUsed: [...new Set(medicineUpdates.map(u => u.source))],
        alreadyOrganized: false,
      },
    });

  } catch (error) {
    console.error('Error organizing medicines:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to organize medicines',
      error: error.message,
    });
  }
};

/**
 * Get all folders for a user
 * GET /api/medicines/folders
 */
exports.getFolders = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const folders = await MedicineFolder.find({ userId }).sort({ name: 1 });
    
    const foldersWithCounts = await Promise.all(
      folders.map(async (folder) => {
        const count = await Medicine.countDocuments({
          userId,
          folders: folder._id,
        });
        
        return {
          _id: folder._id,
          name: folder.name,
          description: folder.description,
          color: folder.color,
          isSystemGenerated: folder.isSystemGenerated,
          medicineCount: count,
          createdAt: folder.createdAt,
        };
      })
    );

    res.json({
      success: true,
      folders: foldersWithCounts,
    });
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch folders',
      error: error.message,
    });
  }
};

/**
 * Move medicine to folder
 * POST /api/medicines/:medicineId/move
 */
exports.moveMedicineToFolder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { medicineId } = req.params;
    const { folderIds } = req.body;

    const medicine = await Medicine.findOne({ _id: medicineId, userId });
    
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found',
      });
    }

    if (folderIds && folderIds.length > 0) {
      const folders = await MedicineFolder.find({
        _id: { $in: folderIds },
        userId,
      });

      if (folders.length !== folderIds.length) {
        return res.status(403).json({
          success: false,
          message: 'Invalid folder IDs',
        });
      }
    }

    medicine.folders = folderIds || [];
    medicine.organizationMetadata = {
      ...medicine.organizationMetadata,
      isManual: true,
      categorizedAt: new Date(),
    };
    await medicine.save();

    res.json({
      success: true,
      message: 'Medicine moved successfully',
      medicine,
    });
  } catch (error) {
    console.error('Error moving medicine:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to move medicine',
      error: error.message,
    });
  }
};

/**
 * Delete a folder
 * DELETE /api/medicines/folders/:folderId
 */
exports.deleteFolder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { folderId } = req.params;

    const folder = await MedicineFolder.findOne({ _id: folderId, userId });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found',
      });
    }

    await Medicine.updateMany(
      { userId, folders: folderId },
      { $pull: { folders: folderId } }
    );

    await MedicineFolder.deleteOne({ _id: folderId });

    res.json({
      success: true,
      message: 'Folder deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete folder',
      error: error.message,
    });
  }
};

/**
 * Update lookup cache (manual override)
 * PUT /api/medicines/lookup-cache/:normalizedName
 */
exports.updateLookupCache = async (req, res) => {
  try {
    const { normalizedName } = req.params;
    const { indications, categories } = req.body;

    let cacheEntry = await MedicineLookupCache.findOne({ normalizedName });

    if (!cacheEntry) {
      return res.status(404).json({
        success: false,
        message: 'Cache entry not found',
      });
    }

    cacheEntry.indications = indications;
    cacheEntry.categories = categories;
    cacheEntry.manualOverride = true;
    cacheEntry.source = 'manual';
    cacheEntry.confidence = 1.0;
    await cacheEntry.save();

    res.json({
      success: true,
      message: 'Cache updated successfully',
      cacheEntry,
    });
  } catch (error) {
    console.error('Error updating cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cache',
      error: error.message,
    });
  }
};
