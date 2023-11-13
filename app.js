const express = require('express');
const bodyParser = require('body-parser');
const Negotiator = require('negotiator');
const { stringify } = require('csv-stringify/sync');
const fs = require('fs');
const path = require('path');
const app = express();
require('dotenv').config();
app.use('/data', express.static('data'));

app.set('view engine', 'ejs');
app.use(bodyParser.json());

var sourcedir = "data/example4/";
let jsonData = {};

app.locals.readFileContent = function(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error("Error reading file:", error);
    return "Error reading file";
  }
};

function loadDataFromDirectory(directory) {
  try {
    const dataPath = path.join(directory, 'data.jsonld');
    if (fs.existsSync(dataPath)) {
      jsonData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      console.log(`Data loaded from ${dataPath}`);
    } else {
      throw new Error(`data.jsonld not found in ${directory}`);
    }
  } catch (error) {
    console.error(`Error loading data: ${error.message}`);
    jsonData = null;
  }
}

// Initial data load
loadDataFromDirectory(sourcedir);

app.use((req, res, next) => {
  if (req.query.sourceDir) {
    const potentialDir = `data/${req.query.sourceDir}/`;

    if (fs.existsSync(potentialDir)) {
      sourcedir = potentialDir;
    } else {
      console.warn(`Requested directory ${potentialDir} does not exist, using default data.`);
      sourcedir = "data/";
    }
    loadDataFromDirectory(sourcedir);

    // Remove sourceDir query parameter and redirect
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    parsedUrl.searchParams.delete('sourceDir');
    return res.redirect(303, parsedUrl.pathname + parsedUrl.search);
  }
  next();
});

function getMetadataFromGraph(jsonLdGraph) {
  const metadata = {};
  for (const key in jsonLdGraph) {
    if (!['@context', 'url', 'tableSchema', 'dialect', 'rows', '@graph'].includes(key)) {
      metadata[key] = jsonLdGraph[key];
    }
  }
  return metadata;
}


function sendData(transactionData,req,res) {
  const negotiator = new Negotiator(req);
  const preferredMediaType = negotiator.mediaType(['text/html', 'application/ld+json', 'text/csv', 'application/json']);
  const language = negotiator.language(['en', 'fr']) || 'en';

  if (!Array.isArray(transactionData)) {
    transactionData = [transactionData];
  }

  // Extract the metadata from the original JSON-LD graph
  const metadata = getMetadataFromGraph(jsonData);
  let labeledData = transactionData.map(t => getLabelledData(t, language));

  switch (preferredMediaType) {
    case 'application/ld+json':
      const jsonLDResponse = {
        '@context': jsonData['@context'],
        ...Object.fromEntries(Object.entries(metadata)),
        '@graph': [
          transactionData
        ]
      };
      return res.json(jsonLDResponse);
    case 'text/html':
      res.render('transactions', { transactions: transactionData.map(t => getLabelledDataWithURIs(t, language)), metadata, objectToString, sourcedir: sourcedir, renderCsvToTable});
      break;
    case 'text/csv':
      try {
        // Making sure labeledTransactions is always an array
        const transactionsArray = Array.isArray(labeledData) ? labeledData : [labeledData];
        // Convert labeled transaction objects to array of objects for CSV export
        const csvData = transactionsArray.map(transaction => {
          const transactionObject = {};
          for (const [key, value] of Object.entries(transaction)) {
            if (typeof value === 'object' && value !== null) {
              transactionObject[key] = value['@value'] || value['schema:value'] || value;
              tempObject = getLabelledData(value,language);
              for (const tempKey in tempObject) {
                if (tempKey != '@id' && tempKey != 'rdf:type' && tempKey != "@value" && tempKey != 'schema:value') {
                  transactionObject[tempKey] = tempObject[tempKey];
                }
              }
            } else {
              transactionObject[key] = value;
            }
          }
          return transactionObject;
        });

        const csvHeaders = Object.keys(csvData[0]).map(key => ({ key, label: key }));

        const output = stringify(csvData, {
          header: true,
          columns: csvHeaders,
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
        res.send(output);
      } catch (err) {
        console.error(err);
        return res.status(500).send('Internal Server Error');
      }
      break;
    case 'application/json':
      res.json(labeledData);
      break;
    default:
      return res.status(406).send('Not Acceptable');
  }

}

function objectToString(obj) {
  if (typeof obj !== 'object') return obj;

  if (obj['@value'] && obj['@type'] && Object.keys(obj).length === 2) {
    return obj['@value']; // Return just the value if @value and @type are the only keys
  }

  if (obj['@id'] && Object.keys(obj).length === 1) {
    // Only @id is present, return it as a link
    return `<a href="${obj['@id']}">${obj['@id']}</a>`;
  }

  let str = '<ul>';
  for (const key in obj) {
    if (key !== '@id') {
      str += `<li>${key}: ${objectToString(obj[key])}</li>`;
    }
  }
  str += '</ul>';

  if (obj['@id']) {
    str = `<a href="${obj['@id']}">${str}</a>`; // wrap the entire content with a link if @id is present
  }

  return str;
}

function renderCsvToTable(filePath) {
  try {
    const csvContent = fs.readFileSync(filePath, 'utf8');
    const rows = csvContent.split('\n').map(row => row.split(','));
    let htmlTable = '<table class="csv-table">';
    rows.forEach((row, index) => {
      htmlTable += '<tr>';
      const tag = (index === 0) ? 'th' : 'td'; // Use <th> for header row
      row.forEach(cell => {
        htmlTable += `<${tag}>${cell}</${tag}>`;
      });
      htmlTable += '</tr>';
    });
    htmlTable += '</table>';
    return htmlTable;
  } catch (error) {
    return 'File not found or unable to read the file';
  }
}

function expandURI(prefix, context) {
  const [namespace, property] = prefix.split(':');
  if (context[namespace]) {
    return context[namespace] + property;
  }
  return prefix; // Return the original prefix if not found in context
}

function getLabelledDataWithURIs(transactionData, language) {
  // Map the transaction data to labels and values
  const context = jsonData['@context'];
  const labeledData = {};
  for (const key in transactionData) {
    let skip = false;
    let label = key;
    let value = transactionData[key];
    let uri = null;
    let link = null;

    if (jsonData[key] && jsonData[key]['rdfs:label']) {
      const labels = jsonData[key]['rdfs:label'];
      const labelObject = labels.find(label => label['@language'] === language) || labels.find(label => label['@language'] === 'en');
      label = labelObject ? labelObject['@value'] : key;
      uri = jsonData[key]['@id'] ? jsonData[key]['@id'] : null;
      link = expandURI(uri,context);
    }

    if (typeof transactionData[key] === 'object') {
      if ('@value' in transactionData[key]) {
        value = transactionData[key]['@value'];
      } else if ('@id' in transactionData[key]) {
        uri = transactionData[key]['@id'];
        if (uri.startsWith(transactionData['@id'] + "#")) {
          tempObject = getLabelledDataWithURIs(value,language);
          for (const tempKey in tempObject) {
            if (tempKey != '@id' && tempKey != 'rdf:type' && tempKey != '@value' && tempKey != 'schema:value') {
              labeledData[tempKey] = tempObject[tempKey];
            }
          }
          value = value['@value'] || value['schema:value'] || value;
        } else if (jsonData[uri] && jsonData[uri]['rdfs:label']) {
          const labelObject = jsonData[uri]['rdfs:label'].find(label => label['@language'] === language) || jsonData[uri]['rdfs:label'].find(label => label['@language'] === 'en');
          value = labelObject ? labelObject['@value'] : uri;
          link = expandURI(uri,context);
        } else {
          value = uri; // Fallback to URI if label not found
        }
      }
    }
    if (!skip) {
      labeledData[label] = { value, link };
    }
  }
  return labeledData;
}

function getLabelledData(transactionData, language) {
  // Map the transaction data to labels and values
  const context = jsonData['@context'];
  const labeledData = {};
  for (const key in transactionData) {
    let label = key;
    let value = transactionData[key];
    let uri = null;
    let link = null;

    if (jsonData[key] && jsonData[key]['rdfs:label']) {
      const labels = jsonData[key]['rdfs:label'];
      const labelObject = labels.find(label => label['@language'] === language) || labels.find(label => label['@language'] === 'en');
      label = labelObject ? labelObject['@value'] : key;
      uri = jsonData[key]['@id'] ? jsonData[key]['@id'] : null;
      link = expandURI(uri,context);
    }

    if (typeof transactionData[key] === 'object') {
      if ('@value' in transactionData[key]) {
        value = transactionData[key]['@value'];
      } else if ('@id' in transactionData[key]) {
        uri = transactionData[key]['@id'];
        if (uri.startsWith(transactionData['@id'] + "#")) {
          value = getLabelledData(transactionData[key],language);
        } else if (jsonData[uri] && jsonData[uri]['rdfs:label']) {
          const labelObject = jsonData[uri]['rdfs:label'].find(label => label['@language'] === language) || jsonData[uri]['rdfs:label'].find(label => label['@language'] === 'en');
          value = labelObject ? labelObject['@value'] : uri;
          link = expandURI(uri,context);
        } else {
          value = uri; // Fallback to URI if label not found
        }
      }
    }
    labeledData[label] = value;
  }
  return labeledData;
}

app.get('/transactions/', async (req, res) => {
  const nodes = jsonData['@graph'] || [];
  const transactionData = nodes.filter(node => {
    return typeof node['@id'] === 'string' && node['@id'].startsWith('http://jpmc.learndata.info/transactions/');
  });
  if (!transactionData) {
    return res.status(404).send('Transaction not found');
  }
  sendData(transactionData,req,res);
});

app.get('/transactions/:id', (req, res) => {
  const transactionId = req.params.id;

  const transactionData = jsonData['@graph'].find(obj => obj['@id'] === `http://jpmc.learndata.info/transactions/${transactionId}`);

  if (!transactionData) {
    return res.status(404).send('Transaction not found');
  }
  sendData(transactionData,req,res);
});

const host = process.env.HOST || 'localhost';
const port = process.env.PORT || 3000;

app.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}`);
});