const fs = require('fs');
const path = require('path');
const successColor = '\x1b[32m%s\x1b[0m';
const checkSign = '\u{2705}';

const envFile = `export const environment = {
    apiURL: '${process.env.API_URL}',
    cdnTranslationUrl: '${process.env.CDN_TRANSLATION_URL}',
    gtmBetaProperty: '${process.env.GTM_BETA_PROPERTY}',
    isMaintenance: ${process.env.IS_MAINTENANCE},
    location: { endpoint: '${process.env.LOCATION_ENDPOINT}', token: '${process.env.LOCATION_TOKEN}', },
    mode: '${process.env.MODE}',
    paypalClientId: '${process.env.PAYPAL_CLIENT_ID}',
    production: ${process.env.PRODUCTION},
    trackingUrl: '${process.env.TRACKING_URL}',
    defaultMaxAdultInRoom: Number(${process.env.DEFAULT_MAX_ADULT_IN_ROOM || 14})
};
`;

// Paths to the files
const sourceIndexProdPath = path.join(__dirname, './src/index.prod.html');
const sourceIndexQAPath = path.join(__dirname, './src/index.qa.html');
const currentDevPath = path.join(__dirname, './src/index.html');
let sourceFilePath;
switch (process.env.MODE) {
  case 'production':
    sourceFilePath = sourceIndexProdPath;
    break;
  case 'qa':
    sourceFilePath = sourceIndexQAPath;
    break;
  default:
    sourceFilePath = currentDevPath;
    break;
}
// Read the content of the selected source file
fs.readFile(sourceFilePath, 'utf8', (readErr, data) => {
  if (readErr) {
    return console.error(`Error reading file ${sourceFilePath}:`, readErr);
  }

  // Write the content to index.html
  fs.writeFile(currentDevPath, data, 'utf8', (writeErr) => {
    if (writeErr) {
      return console.error(`Error writing file ${currentDevPath}:`, writeErr);
    }
    console.debug(
      successColor,
      `Replaced content of ${currentDevPath} with ${sourceFilePath}`
    );
  });
});

const targetPath = path.join(__dirname, './src/environments/environment.ts');
fs.writeFile(targetPath, envFile, (err) => {
  if (err) {
    console.error(err);
    throw err;
  } else {
    console.debug(
      successColor,
      `${checkSign} Successfully generated environment.ts`
    );
  }
});
