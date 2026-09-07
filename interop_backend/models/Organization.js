const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  identifier: { type: String, unique: true, required: true }, // e.g. "org_apollo_metro"
  type: { type: String, enum: ['prov', 'dept', 'team', 'govt', 'ins', 'other'], default: 'prov' },
  active: { type: Boolean, default: true },
  phone: String,
  email: String,
  address: {
    line: [String],
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  fhirResource: { type: Object }
}, { timestamps: true });

module.exports = mongoose.model('InteropOrganization', organizationSchema);
