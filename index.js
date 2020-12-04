import { generateOauth1Headers } from './generateOauth1Header.js';
//const oauth = require('./generateOauth1Header.js');

const recentSearchEndpoint = 'https://api.twitter.com/2/tweets/search/recent';
const tweetLookupEndpoint = 'https://api.twitter.com/2/tweets';
const postTweetEndpoint = 'https://api.twitter.com/1.1/statuses/update.json';
const hgTranscribeEndpoint = 'https://hierogly.ph/api/transcribe';

const appAuthHeader = new Headers({ 'Authorization': `Bearer ${BEARER_TOKEN}` })
const userAuthCreds = {
  accessToken: ACCESS_TOKEN,
  accessSecret: ACCESS_TOKEN_SECRET,
  consumerKey: CONSUMER_KEY,
  consumerSecret: CONSUMER_SECRET
};

function replyWithLink(username, videoId) {
  return `@${username} Here is a readable transcript of your video: https://hierogly.ph/transcribe?v=${videoId}`;
}

function replyWithError(username) {
  return `@${username} We're sorry, but there is no transcript available. More information here: https://hierogly.ph/about`;
}

async function handleScheduled(event) {
  const last_seen_id = await DATA.get('last_seen_id');
  //const last_seen_date = await DATA.get('last_seen_date');
  // TODO Verify last_seen_id is within 7 days. Or record when last seen id is last set.

  // Construct RecentSearch API request
  const searchUrl = new URL(recentSearchEndpoint);
  searchUrl.searchParams.append('query', '"@HieroglyphApp transcribe"');
  //searchUrl.searchParams.append('since_id', last_seen_id);
  //searchUrl.searchParams.append('since_id', '1331157388339113984');
  searchUrl.searchParams.append('since_id', '1334133463281233921');
  searchUrl.searchParams.append('tweet.fields', 'referenced_tweets');
  searchUrl.searchParams.append('user.fields', 'username');
  searchUrl.searchParams.append('expansions', 'author_id');

  let searchRequestResponse = await fetch(searchUrl.href, {
    headers: {
      'Authorization': `Bearer ${BEARER_TOKEN}`
    }
  })
    .then(res => res.json())
    .catch(err => console.log(err))
  
  console.log(searchRequestResponse)

  // Map user ID to username
  let userMap = new Map(searchRequestResponse.includes.users.map(user => [user.id, user.username]));

  // Map referenced tweet to array with original tweets and their author
  // Save relevant tweet data into an array. Save referenced tweet IDs in a set.
  let tweetList = [];
  let refSet = new Set();
  searchRequestResponse.data.forEach(tweet => {
    // Only care about first referenced tweet. If others present, then probably invalid ¯\_(ツ)_/¯
    const refId = tweet.referenced_tweets[0].id;
    refSet.add(refId);
    userMap.get(tweet.id)
    //const tweetObject = { username: userMap[tweet.id], tweetId: tweet.id, referencedId: refId };
    tweetList.push({ username: userMap.get(tweet.author_id), id: tweet.id, referencedId: refId });
    //if(tweetMap.has(refId)) {
    //  tweetMap.get(refId).push(tweetObject);
    //} else {
    //  tweetMap.set(refId, [tweetObject]);
    //}
  });

  // Save all youtube links from each referenced tweet
  let linkMap = new Map();
  for(const refId of refSet) {
    const lookupUrl = new URL(`${tweetLookupEndpoint}/${refId}`);
    lookupUrl.searchParams.append('tweet.fields', 'entities');

    let lookupResponse = await fetch(lookupUrl.href, {
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`
      }
    })
      .then(res => res.json());

    let link = new URL(`${lookupResponse.data.entities.urls[0].expanded_url}`);
    if(link.hostname.indexOf('youtube') != -1) {
      let videoId = link.searchParams.get('v');
      linkMap.set(refId, videoId);
    }
    else if(link.hostname.indexOf('youtu') != -1) {
      let videoId = link.pathname.substring(1); // Remove first '/' character
      linkMap.set(refId, videoId);
    }
    else {
      continue;
    }
  }

  // Verify Hieroglyph has a transcript for each link. Also caches available transcripts.
  for(const [key, value] of linkMap) {
    let { success } = await fetch(`${hgTranscribeEndpoint}?v=${value}`)
      .then(res => res.json());
    if(success !== true) {
      linkMap.delete(key);
    }
  }

  console.log(linkMap)
  // Reply to each transcribe request
  let results;
  for(const { username, id, referencedId } of tweetList) {
    let reply = linkMap.has(referencedId)
      ? replyWithLink(username, linkMap.get(referencedId))
      : replyWithError(username);

    const tweetParams = {
      status: reply,
      in_reply_to_status_id: id
    }

    // Create URL object b/c its easier than encoding the URL ourselves
    const postTweetUrl = new URL(postTweetEndpoint);
    postTweetUrl.searchParams.append('status', tweetParams.status);
    postTweetUrl.searchParams.append('in_reply_to_status_id', tweetParams.in_reply_to_status_id);

  //const oauthHeader = new Headers({
  //  'Authorization': generateOauth1Headers('POST', postTweetEndpoint, tweetParams, userAuthCreds)
  //});
    let oauthHeader = { 'Authorization': `${generateOauth1Headers('POST', postTweetEndpoint, tweetParams, userAuthCreds)}` }
    let result = await fetch(postTweetUrl.href, {
      headers: oauthHeader
    })
      .then(res => res.json())
      .catch(err => err)
    console.log(JSON.stringify(result))
    //results.push(result);
  }

  return new Response('success!!', {
    headers: { 'content-type': 'application/json' },
  })
}

async function test() {
  let baseUrl = 'https://api.twitter.com/1.1/statuses/show.json'
  let testParams = { id: '1331750396876951555' }
  const url = new URL(baseUrl);
  url.searchParams.append('id', '1331750396876951555');

  let oauthHeader = { 'Authorization': `${generateOauth1Headers('GET', baseUrl, testParams, userAuthCreds)}` }
  //oauthHeader = { 'Authorization': `${generateOauth1Headers('GET', baseUrl, testParams)}` }
  console.log(oauthHeader)
  let result = await fetch(url.href, {
    headers: oauthHeader
  })
    .then(res => res.json())
    .catch(err => err)
  
  console.log(result)
}

addEventListener('fetch', event => {
  event.respondWith(handleScheduled(event))
  //event.respondWith(test(event))
});
//addEventListener('scheduled', event => {
//  event.waitUntil(handleScheduled(event))
//});