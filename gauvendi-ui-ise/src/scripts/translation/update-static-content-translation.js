const { readdirSync, readFileSync } = require('fs');
const fetch = require('node-fetch');
const path = require('path');

const GRAPHQL_ENDPOINT = 'https://admin-services-qa.gauvendi.com/graphql';
const GRAPHQL_TOKEN = '';
const inputDirPath = './src/scripts/translation/data-qa';

const mutation = `
mutation UpdateStaticContentTranslation($input: [UpdateContentTranslationInput]!) {
  updateContentTranslation(input: $input) {
    count
    totalPage
    data {
      ... on StaticContentTranslation {
        id
        locale {
          id
          name
          code
        }
        entityTranslationConfig {
          id
          name
          code
          availableAttributeKeys
        }
        attribute {
          key
          value
        }
      }
    }
  }
}
`;

async function loadInputData() {
  const files = readdirSync(inputDirPath).filter((f) => f.endsWith('.json'));
  const combined = [];

  for (const file of files) {
    const content = readFileSync(path.join(inputDirPath, file), 'utf-8');
    const parsed = JSON.parse(content);
    combined.push(parsed);
  }

  return combined;
}

async function updateStaticContentTranslation() {
  try {
    const inputData = await loadInputData();

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GRAPHQL_TOKEN}`
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          input: inputData
        }
      })
    });

    const result = await response.json();
    if (result?.data?.updateContentTranslation?.data?.length) {
      console.info(
       '\x1b[32m%s\x1b[0m',  `✓ Successfully updated static content translations`
      );
    } else {
      console.error('\x1b[31m%s\x1b[0m', '✖ Failed to update static content translations');
    }
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '✖ Error executing mutation:', error);
  }
}

updateStaticContentTranslation();
