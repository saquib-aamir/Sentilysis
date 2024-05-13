const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

// Path to your JavaScript file
const jsFilePath = './world-merc.js';

function updateMapData(csvFilePath, jsFilePath) {
  let sentimentCounts = {};

  // Read and process the CSV file
  fs.createReadStream(path.resolve(csvFilePath))
    .pipe(csv())
    .on('data', (row) => {
      const country = row.user_location?.trim();
      const sentiment = row.predicted_sentiment?.trim();

      if (country && sentiment) {
        if (!sentimentCounts[country]) {
          sentimentCounts[country] = { positive: 0, negative: 0 };
        }

        if (sentiment === 'positive') {
          sentimentCounts[country].positive++;
        } else if (sentiment === 'negative') {
          sentimentCounts[country].negative++;
        }
      }
    })
    .on('end', () => {
      console.log('CSV processing complete. Updating JavaScript file...');

      // Read the existing JavaScript file
      fs.readFile(jsFilePath, 'utf8', (err, data) => {
        if (err) {
          console.error('Error reading JavaScript file:', err);
          return;
        }

        // Extract the JavaScript object from the file
        const startIndex = data.indexOf('{');
        const endIndex = data.lastIndexOf('}') + 1;
        const jsData = JSON.parse(data.substring(startIndex, endIndex));

        // Update the map data based on the sentiment counts
        Object.keys(jsData.paths).forEach(code => {
          const countryData = jsData.paths[code];
          const countryName = countryData.name.trim();
          const sentimentData = sentimentCounts[countryName];

          if (sentimentData) {
            const { positive, negative } = sentimentData;
            countryData.tweetcounts = positive + negative;
            countryData.status = positive > negative ? 'positive' : 'negative';
          }
        });

        // Convert the updated object back to a string
        const updatedJsContent = `jsVectorMap.addMap('world_merc', ${JSON.stringify(jsData, null, 2)});`;

        // Write the updated content back to the same JavaScript file
        fs.writeFile(jsFilePath, updatedJsContent, (err) => {
          if (err) {
            console.error('Error writing updated JavaScript file:', err);
          } else {
            console.log('JavaScript file has been successfully updated!');
          }
        });
      });
    })
    .on('error', (err) => {
      console.error('Error processing CSV file:', err);
    });
}

// Replace './path/to/your/sentiment_data.csv' and './path/to/world-mec.js' with the actual paths
updateMapData('./labeled_tweets.csv', jsFilePath);
