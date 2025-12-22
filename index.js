import 'dotenv/config';
import cron from 'node-cron';
import { TwitterApi } from 'twitter-api-v2';

// --- Firebase ---
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, update } from "firebase/database";

// Telegram, promo, and quickbuy links
const TG_LINK = "https://t.me/nftfanstokens";
const QUICKBUY_LINK = "https://www.nftfanstoken.com/quickbuynft/";

// --- Firebase Setup (update if needed) ---
const firebaseConfig = {
  apiKey: "AIzaSyC6wYBu-KOXkDmB-84_7OPtY71zBX4FzRY",
  authDomain: "newnft-47bd7.firebaseapp.com",
  databaseURL: "https://newnft-47bd7-default-rtdb.firebaseio.com",
  projectId: "newnft-47bd7",
  storageBucket: "newnftfanstoken.appspot.com",
  messagingSenderId: "172043823738",
  appId: "1:172043823738:web:daf1fcfb7862d7d8f029c3"
};
const fbApp = initializeApp(firebaseConfig);
const db = getDatabase(fbApp);

// --- Twitter API Setup ---
const client = new TwitterApi({
  appKey: process.env.X_APP_KEY,
  appSecret: process.env.X_APP_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_SECRET
});
async function canPostTweet() {
  const logRef = ref(db, "tweetLog");
  const snap = await get(logRef);

  const now = Date.now();
  let timestamps = [];

  if (snap.exists()) {
    timestamps = Object.keys(snap.val()).map(ts => Number(ts));
  }

  // Filter posts from last 24 hours
  const recent = timestamps.filter(ts => now - ts < ONE_DAY_MS);

  // If under limit, you're good
  if (recent.length < MAX_POSTS_24H) {
    return true;
  }

  // --- NEW: Enforce 24h lock from last post ---
  const lastPost = Math.max(...timestamps);
  const unlockAt = lastPost + ONE_DAY_MS;

  if (now < unlockAt) {
    const waitMs = unlockAt - now;
    const hours = (waitMs / 3600000).toFixed(2);

    console.log(`[RATE LIMIT] Hit 17 posts. Must wait ${hours} hours until posting again.`);
    return false;
  }

  return true;
}


  const recent = timestamps.filter(ts => now - ts < ONE_DAY_MS);

  if (recent.length >= MAX_POSTS_24H) {
    console.log(`[RATE LIMIT] Blocked: ${recent.length} posts in last 24h`);
    return false;
  }

  return true;
}

// --- TEMPLATES for HOURLY TWEET ---
// Generate a random token bonus string (e.g. "5B $NFTFAN", "500M $NFTFAN", "1B $NFTFAN")
function getRandomTokenBonus() {
  const choices = [
    "100M $NFTFAN",
    "250M $NFTFAN",
    "500M $NFTFAN",
    "1B $NFTFAN",
    "2B $NFTFAN",
    "5B $NFTFAN",   // matches your claim amount used in other places
    "10B $NFTFAN"
  ];
  return choices[Math.floor(Math.random() * choices.length)];
}

const TEMPLATES = [
  "🚀 Win {bonus}! RT, Like & Follow @nftfanstoken to qualify! Drop your wallet below 👇",
  "💸 Claim {bonus} — RT, Like & tag a friend. Follow @nftfanstoken and drop your wallet to enter!",
  "🎁 Airdrop alert: {bonus}! Follow @nftfanstoken + RT this post and drop your wallet to participate!",
  "⚡ Lightning drop! {bonus} to random RT & Like — must Follow @nftfanstoken. Drop your wallet!",
  "🔥 Hottest giveaway! Win {bonus} 🚀 Follow @nftfanstoken & RT. Wallet below for entry.",
  "📢 Want {bonus}? RT + Like + Follow @nftfanstoken! Drop your wallet to join.",
  "🎉 Party time! Win {bonus} – RT, Like, and Follow @nftfanstoken. Drop wallet now!",
  "🤩 Don’t miss! {bonus} airdrop 🍀 RT + Like + Follow @nftfanstoken. Drop wallet to enter.",
  "🌊 Catch the {bonus} wave! RT + Like, Follow @nftfanstoken. Drop your wallet to ride!",
  "💚 Big $NFTFAN love! Get {bonus}. RT, Like & Follow @nftfanstoken. Drop wallet!",
  "😎 Ready for {bonus}? RT & Like, Follow @nftfanstoken, comment your wallet! 🔥",
  "💥 {bonus} drop! Join @nftfanstoken family: RT, Like & Follow. Drop wallet below.",
  "🪂 Free {bonus}! Requirements: RT, Like & Follow @nftfanstoken. Drop wallet for the win.",
  "🎯 Your chance to win {bonus}! RT, Like & Follow @nftfanstoken now! Drop wallet below.",
  "🏆 Who wants {bonus}? RT this, Like, Follow @nftfanstoken. Drop wallet to enter!",
  // Telegram group + bonus promo
  `🤑 Win {bonus} + claim **FREE 5 BILLION $NFTFAN**? RT, Like & Follow @nftfanstoken! Join TG: ${TG_LINK}. Drop wallet!`,
  `😱 Massive {bonus} drop + 5B $NFTFAN bonus! RT, Like, Follow @nftfanstoken & join TG: ${TG_LINK}. Drop wallet!`,
  `🏅 {bonus} for followers! Join our TG ${TG_LINK} for **5 BILLION $NFTFAN**. RT + Like + Follow @nftfanstoken. Drop wallet!`,
  `🚨 Don’t miss out: RT, Like, Follow @nftfanstoken for {bonus} plus join TG: ${TG_LINK} for 5B $NFTFAN! Drop wallet.`,
  `🌟 DOUBLE DROP – {bonus} + 5B $NFTFAN!! RT, Like, Follow @nftfanstoken + join TG ${TG_LINK}! Drop wallet.`,
  // Pre-sale shill
  `🔥 Get {bonus} now and **grab $NFTFAN in pre-sale!** Visit: ${QUICKBUY_LINK} 🛒. RT, Like & Follow @nftfanstoken. Drop wallet!`,
  `⏰ {bonus} drop + **Buy $NFTFAN Pre Sale:** ${QUICKBUY_LINK} – RT, Like, and Follow @nftfanstoken. Drop wallet below!`,
  `💰 Don't just take {bonus} – get early $NFTFAN at presale! ${QUICKBUY_LINK} RT, Like, Follow @nftfanstoken. Drop wallet!`,
  `🎉 Win {bonus} & buy $NFTFAN before launch! Pre Sale: ${QUICKBUY_LINK} 🚀 RT, Like, Follow @nftfanstoken, drop wallet!`,
  "Drop your wallet below for a surprise {bonus} airdrop! Like, RT & Follow @nftfanstoken to qualify!",
  "Retweet, Like, and Follow @nftfanstoken for a shot at {bonus}! Drop wallet now 🍀",
  "Let's make your wallet happy! Drop wallet, RT, Like, and Follow @nftfanstoken for {bonus} chance.",
  "💎 Loyal followers get {bonus} – just RT, Like, Follow @nftfanstoken & Drop your wallet! 🚀",
  "🥳 Airdrop celebration: {bonus} – Like, RT, and Follow @nftfanstoken! Drop wallet for entry.",
  `🚨 $NFTFAN Token pre-sale happening now: ${QUICKBUY_LINK} 🚨 Win {bonus} by RT, Like, Follow @nftfanstoken + Drop Wallet!`,
  `🟢 Early supporters win: {bonus}. Join TG ${TG_LINK} & buy $NFTFAN at presale (${QUICKBUY_LINK}) RT, Like, Follow, drop wallet!`,
  "Drop your wallet, then RT, Like, & Follow @nftfanstoken for a shot at {bonus} + more surprises coming! 🚀"
];

// Get a random promo tweet
function getRandomTweetText() {
  const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
  const bonus = getRandomTokenBonus();
  return template.replace(/\{bonus\}/g, bonus);
}

// --- Fetch 6 Usernames from Firebase & Mark as "done" ---
async function getUsernamesFromFirebase() {
  try {
    const snap = await get(ref(db, "groups"));
    if (!snap.exists()) throw new Error("No groups found");
    const groups = snap.val();
    const available = Object.entries(groups).filter(([_, g]) =>
      g.status !== "done" &&
      Array.isArray(g.usernames) &&
      g.usernames.length > 0
    );
    if (available.length === 0) return [];
    
    let selected = [];
    const usedKeys = [];
    for (const [key, group] of available) {
      if (selected.length >= 6) break;
      selected.push(...group.usernames);
      usedKeys.push(key);
    }
    selected = selected.slice(0, 6);

    // Mark as done
    const updates = {};
    usedKeys.forEach(k => updates[`groups/${k}/status`] = "done");
    if (Object.keys(updates).length) await update(ref(db), updates);

    return selected;
  } catch (error) {
    console.error('Could not fetch usernames:', error);
    return [];
  }
}

// --- Post Random Promo Tweet ---
async function postTweet() {
  try {
    const text = getRandomTweetText();
    const { data } = await client.v2.tweet(text);
    console.log(`[${new Date().toISOString()}] Tweeted: ${data.text} (ID: ${data.id})`);
  } catch (error) {
    console.error('Promo tweet failed:', error);
  }
}

// --- Post Username Invite Tweet every 20 minutes ---
async function postUsernameInviteTweet() {
  try {
    const usernames = await getUsernamesFromFirebase();
    if (usernames.length === 0) {
      console.log('No usernames available for the username invite tweet.');
      return;
    }
    const tweetText = `Hello, ${usernames.join(' ')} you are invited to claim 5 Billion free $NFTFAN TOKENS, just drop your evm wallet in our TG group: ${TG_LINK}`;
    const { data } = await client.v2.tweet(tweetText);
    console.log(`[${new Date().toISOString()}] Username Invite Tweet: ${data.text} (ID: ${data.id})`);
  } catch (error) {
    console.error('Username invite tweet failed:', error);
  }
}

// --- Tweet on Launch ---
postTweet();
postUsernameInviteTweet();

// --- Cron Jobs ---
// Every hour: general NFTFAN promo tweet
cron.schedule('0 * * * *', postTweet);
// Every 20 minutes: username-invite / claim tweet (promotes 5B $NFTFAN claim in TG)
cron.schedule('*/20 * * * *', postUsernameInviteTweet);
