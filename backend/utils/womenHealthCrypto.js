const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // For AES, this is always 16

const getHash = (key) => {
    if (!key) {
        throw new Error('WOMEN_HEALTH_HASH environment variable is not set');
    }
    // Ensure key is 32 bytes for aes-256
    return crypto.createHash('sha256').update(key).digest();
};

exports.encryptWomenHealth = (data, secretKey) => {
    try {
        const key = getHash(secretKey);
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        
        const jsonStr = JSON.stringify(data);
        let encrypted = cipher.update(jsonStr);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (error) {
        console.error("Encryption error:", error);
        throw new Error("Failed to encrypt data");
    }
};

exports.decryptWomenHealth = (encryptedBlob, secretKey) => {
    try {
        const key = getHash(secretKey);
        const textParts = encryptedBlob.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        
        return JSON.parse(decrypted.toString());
    } catch (error) {
        console.error("Decryption error:", error);
        throw new Error("Failed to decrypt data");
    }
};
