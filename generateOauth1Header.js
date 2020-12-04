const crypto = require('crypto');

// Generate OAuth 1.0a headers for Twitter v1 API
// https://developer.twitter.com/en/docs/authentication/oauth-1-0a/authorizing-a-request
function generateOauth1Headers(method, url, params, creds) {
  console.log(url)
  console.log(params)
  console.log(creds)
  // Make object with all OAuth fields for header
  const oauth = {
    oauth_consumer_key: creds.consumerKey,
    oauth_token: creds.accessToken,
    oauth_timestamp: Math.round((new Date()).getTime() / 1000.0),
    oauth_version: '1.0',
    oauth_signature_method: 'HMAC-SHA1',
    oauth_nonce: Math.random().toString(36).substring(7) // MUST BE ALPHANUMERIC
  };

  // Generate all fields needed for signature, which are OAuth fields and API specific params
  // https://developer.twitter.com/en/docs/authentication/oauth-1-0a/creating-a-signature
  const allParams = { ...oauth, ...params };
  let generatedParams = {};
  Object.keys(allParams).sort().forEach( key => {
    generatedParams[key] = typeof allParams[key] === 'function'
      ? allParams[key]()
      : allParams[key]
  });

  // Generate signature base string from generated params object
  let signatureBaseString = `${method}&${encodeURIComponent(url)}&`;
  Object.entries(generatedParams).forEach(([key, value], idx, arr) => {
    signatureBaseString += encodeURIComponent(`${key}=${value}`);
    if(!Object.is(arr.length - 1, idx)) {
      signatureBaseString += encodeURIComponent(`&`);
    }
  });

  // Create key needed to generate actual OAuth signature
  const signingKey = `${creds.consumerSecret}&${creds.accessSecret}`;

  // Generate signature and append to OAuth object
  const signature = crypto.createHmac('sha1', signingKey).update(signatureBaseString).digest('base64');
  oauth.oauth_signature = encodeURIComponent(signature);

  // Generate OAuth header string from all fields
  let header = `OAuth `
  Object.entries(oauth).forEach(([key, value], idx, arr) => {
    header += `${key}="${value}"`;
    if(!Object.is(arr.length - 1, idx)) {
      header += `, `;
    }
  });

  console.log(header)
  return header;
}

exports.generateOauth1Headers = generateOauth1Headers;