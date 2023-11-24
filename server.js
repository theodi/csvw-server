const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const Negotiator = require('negotiator');
const { stringify } = require('csv-stringify/sync');
const fs = require('fs');
const path = require('path');
const app = express();
const cors = require('cors');
require('dotenv').config();
app.use(cors());

app.use('/diffs', express.static('diffs'));
app.use('/data', express.static('data'));
app.use('/style', express.static('style'));
app.use('/img', express.static('img'));
app.use('/docs', express.static('docs'));
app.set('view engine', 'ejs');
app.use(bodyParser.json());


// Use the session middleware
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
}));

const base = process.env.BASE;
var sourcedir = process.env.DATADIR;
let jsonData = {};

app.locals.readFileContent = function(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error("Error reading file:", error);
    return "Error reading file";
  }
};

function loadJsonData(directory) {
  try {
    const dataPath = path.join(directory, 'data.jsonld');
    if (fs.existsSync(dataPath)) {
      return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    } else {
      throw new Error(`data.jsonld not found in ${directory}`);
    }
  } catch (error) {
    console.error(`Error loading data: ${error.message}`);
    return null;
  }
}

app.use((req, res, next) => {
  if (req.query.source) {
    const requestedDir = `data/${req.query.source}/`;

    if (fs.existsSync(requestedDir)) {
      const newData = loadJsonData(requestedDir);
      if (newData) {
        // Store the selected data in the user's session
        req.session.selectedData = newData;
        req.session.sourceDir = requestedDir;
        console.log(`Data loaded from ${requestedDir}`);
      } else {
        console.warn(`Unable to load data from ${requestedDir}, using the current data.`);
      }
    } else {
      console.warn(`Requested directory ${requestedDir} does not exist, using the current data.`);
    }

    // Remove sourceDir query parameter and redirect
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    parsedUrl.searchParams.delete('source');
    return res.redirect(303, parsedUrl.pathname + parsedUrl.search);
  } else {
    // If sourceDir is not defined and req.session.selectedData is not already defined, load "example1" data directory by default
    if (!req.session.selectedData) {
      const defaultDir = process.env.DATADIR || 'data/example1/';
      const defaultData = loadJsonData(defaultDir);
      if (defaultData) {
        req.session.selectedData = defaultData;
        req.session.sourceDir = defaultDir;
        console.log(`Default data loaded from ${defaultDir}`);
      } else {
        console.warn(`Unable to load default data from ${defaultDir}.`);
      }
    }
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


function sendData(data,req,res) {
  const jsonData = req.session.selectedData;
  const negotiator = new Negotiator(req);
  const preferredMediaType = negotiator.mediaType(['text/html', 'application/ld+json', 'text/csv', 'application/json']);
  const language = negotiator.language(['en', 'fr']) || 'en';

  if (!Array.isArray(data)) {
    data = [data];
  }

  // Extract the metadata from the original JSON-LD graph
  const metadata = getMetadataFromGraph(jsonData);
  let labeledData = {};

  switch (preferredMediaType) {
    case 'application/ld+json':
      const jsonLDResponse = {
        '@context': jsonData['@context'],
        ...Object.fromEntries(Object.entries(metadata)),
        '@graph': [
          data
        ]
      };
      return res.json(jsonLDResponse);
    case 'text/html':
      data = updateIdsWithBase(data,process.env.BASE);
      res.render('dataView', { inputData: data.map(t => getLabelledDataWithURIs(t, language,jsonData)), metadata, objectToString, sourcedir: req.session.sourceDir, base: process.env.BASE, renderCsvToTable});
      break;
    case 'text/csv':
      data = updateIdsWithBase(data,process.env.BASE);
      if (!req.query.simple) {
        data = replacePrefixes(data);
      }
      labeledData = data.map(t => getLabelledData(t, language,jsonData));
      try {
        // Making sure labeledData is always an array
        const dataArray = Array.isArray(labeledData) ? labeledData : [labeledData];
        // Convert labeled data objects to array of objects for CSV export
        const csvData = dataArray.map(item => {
          const dataObject = {};
          for (const [key, value] of Object.entries(item)) {
            if (typeof value === 'object' && value !== null) {
              dataObject[key] = value['@value'] || value['schema:value'] || value['http://schema.org/value'] || value;
              tempObject = getLabelledData(value,language,jsonData);
              for (const tempKey in tempObject) {
                if (tempKey != '@id' && tempKey != 'rdf:type' && tempKey != 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' && tempKey != "@value" && tempKey != 'schema:value' && tempKey !='http://schema.org/value') {
                  dataObject[tempKey] = tempObject[tempKey];
                }
              }
            } else {
              dataObject[key] = value;
            }
          }
          return dataObject;
        });

        const csvHeaders = Object.keys(csvData[0]).map(key => ({ key, label: key }));

        const output = stringify(csvData, {
          header: true,
          columns: csvHeaders,
        });
        const filename = req.path.replace(/\//g, '');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=' + filename + '.csv');
        res.send(output);
      } catch (err) {
        console.error(err);
        return res.status(500).send('Internal Server Error');
      }
      break;
    case 'application/json':
      data = updateIdsWithBase(data,process.env.BASE);
      if (!req.query.simple) {
        data = replacePrefixes(data);
      }
      labeledData = data.map(t => getLabelledData(t, language,jsonData));
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

function getLabelledDataWithURIs(data, language,jsonData) {
  // Map the data to labels and values
  const context = {
    "schema": "http://schema.org/",
    "dc": "http://purl.org/dc/terms/",
    "dcat": "http://www.w3.org/ns/dcat#",
    "xsd": "http://www.w3.org/2001/XMLSchema#",
    "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
    "pay": "http://reference.data.gov.uk/def/payment#"
  };

  const labeledData = {};
  for (const key in data) {
    let skip = false;
    let label = key;
    let value = data[key];
    let uri = null;
    let labellink = null;
    let valuelink = null;

    if (jsonData[key] && jsonData[key]['rdfs:label']) {
      const labels = jsonData[key]['rdfs:label'];
      const labelObject = labels.find(label => label['@language'] === language) || labels.find(label => label['@language'] === 'en');
      label = labelObject ? labelObject['@value'] : key;
      uri = jsonData[key]['@id'] ? jsonData[key]['@id'] : null;
      labellink = expandURI(uri,context);
    } else {
      label = key.split(":")[1] ? key.split(":")[1] : key;
      if (label != key) {
        labellink = expandURI(key,context);
      }
    }
    if (typeof data[key] === 'object') {
      if ('@value' in data[key]) {
        value = data[key]['@value'];
      } else if ('@id' in data[key]) {
        uri = data[key]['@id'];
        if (uri.startsWith(data['@id'] + "#")) {
          tempObject = getLabelledDataWithURIs(value,language,jsonData);
          for (const tempKey in tempObject) {
            if (tempKey != '@id' && tempKey != 'rdf:type' && tempKey != '@value' && tempKey != 'schema:value') {
              labeledData[tempKey] = tempObject[tempKey];
            }
          }
          value = value['@value'] || value['schema:value'] || value;
        } else if (jsonData[uri] && jsonData[uri]['rdfs:label']) {
          const labelObject = jsonData[uri]['rdfs:label'].find(label => label['@language'] === language) || jsonData[uri]['rdfs:label'].find(label => label['@language'] === 'en');
          value = labelObject ? labelObject['@value'] : uri;
          labellink = expandURI(uri,context);
        } else {
          value = uri; // Fallback to URI if label not found
        }
      }
    }
    if (!skip) {
      if (typeof value === 'string') {
        if (value.split(":")[0].startsWith("http")) {
          valuelink = value;
          split = value.split("/");
          value = split[split.length-1];
        }
        if(value.split(":")[1] && !value.split(":")[0].startsWith("http")) {
          valuelink = expandURI(value,context);
          value = value.split(":")[1];
        }
      }
      labeledData[label] = { value, valuelink, labellink };
    }
  }
  return labeledData;
}

function getLabelledData(data, language,jsonData) {
  // Map the data to labels and values
  const context = jsonData['@context'];
  const labeledData = {};
  for (const key in data) {
    let label = key;
    let value = data[key];
    let uri = null;
    let link = null;

    if (jsonData[key] && jsonData[key]['rdfs:label']) {
      const labels = jsonData[key]['rdfs:label'];
      const labelObject = labels.find(label => label['@language'] === language) || labels.find(label => label['@language'] === 'en');
      label = labelObject ? labelObject['@value'] : key;
      uri = jsonData[key]['@id'] ? jsonData[key]['@id'] : null;
      link = expandURI(uri,context);
    }

    if (typeof data[key] === 'object') {
      if ('@value' in data[key]) {
        value = data[key]['@value'];
      } else if ('@id' in data[key]) {
        uri = data[key]['@id'];
        if (uri.startsWith(data['@id'] + "#")) {
          value = getLabelledData(data[key],language,jsonData);
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

function replacePrefixes(data) {
  context = {
    "schema": "http://schema.org/",
    "dc": "http://purl.org/dc/terms/",
    "dcat": "http://www.w3.org/ns/dcat#",
    "xsd": "http://www.w3.org/2001/XMLSchema#",
    "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
    "pay": "http://reference.data.gov.uk/def/payment#"
  };

  function replacePrefix(str) {
      const [prefix, suffix] = str.split(':');
      if (context[prefix]) {
          return context[prefix] + suffix;
      }
      return str;
  }

  // Recursively process data
  function processNode(node) {
      if (typeof node === 'string' && node.includes(':')) {
          return replacePrefix(node);
      } else if (Array.isArray(node)) {
          return node.map(processNode);
      } else if (typeof node === 'object' && node !== null) {
          const newNode = {};
          Object.keys(node).forEach(key => {
              newNode[replacePrefix(key)] = processNode(node[key]);
          });
          return newNode;
      }
      return node;
  }

  return processNode(data);
}

function updateIdsWithBase(data, baseUrl) {
  return data.map(item => {
      const updatedItem = { ...item };
      Object.keys(updatedItem).forEach(key => {
          if (key === '@id' && !updatedItem[key].startsWith('http')) {
              updatedItem[key] = baseUrl + updatedItem[key];
          } else if (typeof updatedItem[key] === 'object' && updatedItem[key] !== null) {
              updatedItem[key] = Array.isArray(updatedItem[key])
                  ? updateIdsWithBase(updatedItem[key], baseUrl)
                  : updateIdsWithBase([updatedItem[key]], baseUrl)[0]; // Recursively update nested objects
          }
      });
      return updatedItem;
  });
}

app.get('*', async (req, res) => {
  jsonData = req.session.selectedData;
  const nodes = jsonData['@graph'] || [];
  let requesturi = 'transactions/';
  requesturi = req.path.slice(1);

  // Define baseValue from contextArray
  const baseValue = jsonData["@context"][1]['@base']; // your logic to get baseValue from contextArray

  // Set a variable for the base URL
  const baseUrl = baseValue === process.env.BASE ? '' : process.env.BASE;

  let data = [];

  if (requesturi.slice(-1) == "/") {
    data = nodes.filter(node => {
      return typeof node['@id'] === 'string' && node['@id'].startsWith(baseUrl + requesturi);
    });
  } else {
    data = jsonData['@graph'].find(obj => obj['@id'] === `${baseUrl}${requesturi}`);
  }
  if (!data || data.length == 0) {
    return res.status(404).send('Item not found');
  }
  sendData(data,req,res);
});

const host = process.env.HOST || 'localhost';
const port = process.env.PORT || 3000;

app.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}`);
});