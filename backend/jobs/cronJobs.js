// [REMOVED] node-cron dependency
const { checkExpiredMedicines } = require('../utils/expiryChecker');

// [REMOVED] Internal scheduling logic.
// checkExpiredMedicines is now exposed via cronRoutes to be triggered externally.

module.exports = { checkExpiredMedicines };
