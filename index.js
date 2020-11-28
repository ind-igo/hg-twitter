const recentSearchEndpoint = 'https://api.twitter.com/2/tweets/search/recent';
const tweetLookupEndpoint = 'https://api.twitter.com/2/tweets';

async function handleScheduled(event) {
  let tweetMap = new Map();
  let linkMap = new Map();
  const last_seen_id = await DATA.get('last_seen_id');

  const appAuthHeader = new Headers({ 'Authorization': `Bearer ${BEARER_TOKEN}` })
  const userAuthHeader = new Headers({ 'Authorization': `OAuth oauth_consumer_key=${}` })
  // TODO userAuthHeader

  // Construct RecentSearch API request
  const searchUrl = new URL(recentSearchEndpoint);
  searchUrl.searchParams.append('query', '"@HieroglyphApp transcribe"');
  searchUrl.searchParams.append('since_id', last_seen_id);
  searchUrl.searchParams.append('tweet.fields', 'referenced_tweets');

  let searchRequestResponse = await fetch(searchUrl.href, { headers: appAuthHeader })
    .then(res => res.json());

  // Map referenced tweet to array with original tweets
  searchRequestResponse.data.forEach(tweet => {
    // Only care about first referenced tweet. If others present, then probably invalid.
    const refId = tweet.referenced_tweets[0].id;
    if(tweetMap.has(refId)) {
      tweetMap.get(refId).push(tweet.id);
    } else {
      tweetMap.set(refId, [tweet.id]);
    }
  });

  // Grab all youtube links from each referenced tweet
  for(const [key, value] of tweetMap) {
    const lookupUrl = new URL(`${tweetLookupEndpoint}/${key}`);
    lookupUrl.searchParams.append('tweet.fields', 'entities');

    let lookupResponse = await fetch(lookupUrl.href, { headers: appAuthHeader })
      .then(res => res.json());

    //console.log(lookupResponse.data.entities.urls[0].expanded_url);
    let link = new URL(`${lookupResponse.data.entities.urls[0].expanded_url}`);
    if(link.hostname.indexOf('youtube') != -1) {
      let videoId = link.searchParams.get('v');
      linkMap.set(key, videoId);
    }
    else if(link.hostname.indexOf('youtu') != -1) {
      let videoId = link.pathname.substring(1); // Remove first '/' character
      linkMap.set(key, videoId);
    }
    else {
      continue;
    }
  }
  console.log(linkMap);

  // Reply to each transcribe request

  return new Response('Hello worker!', {
    headers: { 'content-type': 'text/plain' },
  })
}

addEventListener('fetch', event => {
  event.respondWith(handleScheduled(event))
});
//addEventListener('scheduled', event => {
//  event.waitUntil(handleScheduled(event))
//});