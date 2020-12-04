const fetch = require('node-fetch');
const crypto = require('crypto');
const oauth = require('./generateOauth1Header.js')

const baseUrl = 'https://api.twitter.com/1.1/statuses/show.json'

/*
function generateOauth1Headers(method, url, params) {
  let consumerSecret = 'IgotoRC61pPj10S27yVgm97LiwDBYIZZmH4HMAdP652JomvRMV';
  let accessSecret = 'egrrTByi4I8lhUj1j4RpShNXkTkH8u4LO73QQ9iJIy3zQ';

  const oauth = {
    oauth_consumer_key: '3Wa0H0pFNIZirSCA0zTy1rzkz',
    oauth_token: '1316582317750726658-Vnm7JjkZ74dlD4yLtLbbjzuFHkRYSg',
    oauth_timestamp: Math.round((new Date()).getTime() / 1000.0),
    oauth_version: '1.0',
    oauth_signature_method: 'HMAC-SHA1',
    oauth_nonce: Math.random().toString(36).substring(7) // MUST BE ALPHANUMERIC
  }

  let allParams = {
    ...oauth,
    ...params
  }

  let generatedHeader = {};
  Object.keys(allParams).sort().forEach( key => {
    generatedHeader[key] = typeof allParams[key] === 'function'
      ? allParams[key]()
      : allParams[key]
  });

  let signatureBaseString = `${method}&${encodeURIComponent(url)}&`;
  Object.entries(generatedHeader).forEach(([key, value], idx, arr) => {
    signatureBaseString += encodeURIComponent(`${key}=${value}`);
    if(!Object.is(arr.length - 1, idx)) {
      signatureBaseString += encodeURIComponent(`&`);
    }
  });
  console.log(signatureBaseString)

  const signingKey = `${consumerSecret}&${accessSecret}`;
  const signature = crypto.createHmac('sha1', signingKey).update(signatureBaseString).digest('base64');

  // Append signature to Oauth object
  oauth.oauth_signature = encodeURIComponent(signature);
  console.log(oauth)

  //oauthArray = Object.entries(oauth)
  let header = `OAuth `
  Object.entries(oauth).forEach(([key, value], idx, arr) => {
    header += `${key}="${value}"`;
    if(!Object.is(arr.length - 1, idx)) {
      header += `, `;
    }
  });

  return header;
}*/

const userAuthCreds = {
  accessToken: '1316582317750726658-Vnm7JjkZ74dlD4yLtLbbjzuFHkRYSg',
  accessSecret: 'egrrTByi4I8lhUj1j4RpShNXkTkH8u4LO73QQ9iJIy3zQ',
  consumerKey:'3Wa0H0pFNIZirSCA0zTy1rzkz',
  consumerSecret:'IgotoRC61pPj10S27yVgm97LiwDBYIZZmH4HMAdP652JomvRMV'
};

async function test() {
  let testParams = { id: '1331750396876951555' }
  const url = new URL(baseUrl);
  url.searchParams.append('id', '1331750396876951555');

  let oauthHeader = { 'Authorization': `${oauth.generateOauth1Headers('GET', 'https://api.twitter.com/1.1/statuses/show.json', testParams, userAuthCreds)}` }
  //oauthHeader = { 'Authorization': `${generateOauth1Headers('GET', baseUrl, testParams)}` }
  console.log(oauthHeader)
  let result = await fetch(url.href, {
    headers: oauthHeader
  })
    .then(res => res.json())
    .catch(err => err)
  
  console.log(result)
}

test()