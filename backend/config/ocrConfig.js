const Tesseract = require('tesseract.js');

const performOCR = async (imagePath) => {
  try {
    const { data: { text } } = await Tesseract.recognize(
      imagePath,
      'eng',
      {
        logger: info => console.log(info),
      }
    );
    return text;
  } catch (error) {
    throw new Error('OCR processing failed: ' + error.message);
  }
};

module.exports = { performOCR };
