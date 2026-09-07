const mongoose = require('mongoose');

const apiClientSchema = new mongoose.Schema({
  clientId: { type: String, unique: true, required: true },
  clientSecretHash: { type: String, required: true },
  rawSecret: { type: String }, // Store plaintext once for demo display in developer portal
  name: { type: String, required: true },
  organizationId: { type: String, required: true },
  scopes: [{ type: String }], // e.g. ["patient/*.read", "observation/*.write"]
  role: { type: String, default: 'Integration Client' },
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('InteropApiClient', apiClientSchema);
