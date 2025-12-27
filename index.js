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
// --- Rate Limit: Max 17 posts per 24 hours ---
const MAX_POSTS_24H = 17;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

async function canPostTweet() {
  const logRef = ref(db, "tweetLog");
  const snap = await get(logRef);

  const now = Date.now();
  let timestamps = [];

  if (snap.exists()) {
    timestamps = Object.keys(snap.val()).map(ts => Number(ts));
  }

  const recent = timestamps.filter(ts => now - ts < ONE_DAY_MS);

  if (recent.length >= MAX_POSTS_24H) {
    console.log(`[RATE LIMIT] Blocked: ${recent.length} posts in last 24h`);
    return false;
  }
async function canPostTweet(apiRateInfo = null) {
  const logRef = ref(db, "tweetLog");
  const resetRef = ref(db, "tweetRateLimit/resetAt");

  const [snap, resetSnap] = await Promise.all([get(logRef), get(resetRef)]);

  const now = Date.now();
  let timestamps = [];

  if (snap.exists()) {
    timestamps = Object.keys(snap.val()).map(ts => Number(ts));
  }

  const recent = timestamps.filter(ts => now - ts < ONE_DAY_MS);

  // --- INTERNAL LIMIT CHECK ---
  if (recent.length >= MAX_POSTS_24H) {
    const lastPost = Math.max(...timestamps);
    const unlockAt = lastPost + ONE_DAY_MS;

    if (now < unlockAt) {
      console.log(`[RATE LIMIT] Internal: wait ${(unlockAt - now) / 3600000} hours`);
      return false;
    }
  }

  // --- API RATE LIMIT CHECK (live response) ---
  if (apiRateInfo) {
    if (apiRateInfo.remaining === 0) {
      const resetMs = apiRateInfo.reset * 1000;
      await set(resetRef, resetMs);

      if (now < resetMs) {
        console.log(`[RATE LIMIT] API: wait ${(resetMs - now) / 3600000} hours`);
        return false;
      }
    }
  }

  // --- STORED API RESET CHECK ---
  if (resetSnap.exists()) {
    const resetAt = resetSnap.val();
    if (now < resetAt) {
      console.log(`[RATE LIMIT] Stored API reset: wait ${(resetAt - now) / 3600000} hours`);
      return false;
    }
  }

  return true;
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
   "🚀 Win {bonus} while learning how Subfan hunters track rare drops! RT, Like & Follow @nftfanstoken. Drop wallet 👇",
  "💸 Claim {bonus} + discover how NFT senders keep the ecosystem alive. RT, Like, tag a friend, Follow @nftfanstoken, drop wallet!",
  "🎁 Not just a token — NFTFAN powers jobs in the community. Airdrop {bonus}! Follow + RT, drop wallet to join.",
  "⚡ Lightning drop {bonus}! But remember: Subfan works as a subscription layer for NFT utilities. RT, Like, Follow, drop wallet!",
  "🔥 Giveaway + project insight: NFTFAN builds tools for NFT senders. Win {bonus} 🚀 Follow & RT, wallet below.",
  "📢 Want {bonus}? RT + Like + Follow @nftfanstoken. Learn how Subfan lets creators reward loyal fans. Drop wallet!",
  "🎉 Party time! Win {bonus} – plus see how NFTFAN jobs like hunters keep drops fair. RT, Like, Follow, drop wallet!",
  "🤩 Don’t miss {bonus} airdrop 🍀 — NFTFAN isn’t just tokens, it’s a fan economy. RT + Like + Follow, drop wallet!",
  "🌊 Catch the {bonus} wave! NFTFAN = token + Subfan mechanics for creators. RT + Like, Follow, drop wallet!",
  "💚 Big $NFTFAN love! Get {bonus} while supporting NFT senders who deliver drops. RT, Like, Follow, drop wallet!",
  "😎 Ready for {bonus}? NFTFAN = token + jobs + Subfan. RT & Like, Follow, comment wallet 🔥",
  "💥 {bonus} drop! Join @nftfanstoken family where hunters chase rewards. RT, Like, Follow, drop wallet!",
  "🪂 Free {bonus}! NFTFAN builds a fan economy with Subfan subscriptions. RT, Like, Follow, drop wallet!",
  "🎯 Your chance to win {bonus}! Learn how NFT senders keep drops flowing. RT, Like, Follow, drop wallet!",
  "🏆 Who wants {bonus}? NFTFAN = more than airdrops — it’s a project ecosystem. RT, Like, Follow, drop wallet!",
  "🤑 Win {bonus} + claim FREE 5 BILLION $NFTFAN! RT, Like, Follow @nftfanstoken. Join TG: ${https://t.co/F9oH6XDQlr}. Drop wallet!",
  "😱 Massive {bonus} + 5B $NFTFAN bonus! NFTFAN = Subfan + jobs. RT, Like, Follow, join TG: ${https://t.co/F9oH6XDQlr}, drop wallet!",
  "🏅 {bonus} for followers! TG ${https://t.co/F9oH6XDQlr} = hub for hunters & senders. RT + Like + Follow, drop wallet!",
  "🚨 Don’t miss: RT, Like, Follow @nftfanstoken for {bonus} + join TG: ${https://t.co/F9oH6XDQlr} for 5B $NFTFAN! Drop wallet.",
  "🌟 DOUBLE DROP – {bonus} + 5B $NFTFAN!! NFTFAN = project + Subfan. RT, Like, Follow, join TG ${https://t.co/F9oH6XDQlr}, drop wallet!",
  "🔥 Get {bonus} now + grab $NFTFAN in pre-sale! Visit: ${https://t.co/l6g0wPf8YA}. RT, Like, Follow, drop wallet!",
  "⏰ {bonus} + Buy $NFTFAN Pre Sale: ${https://t.co/l6g0wPf8YA}. NFTFAN = Subfan mechanics + jobs. RT, Like, Follow, drop wallet!",
  "💰 Don’t just take {bonus} – get early $NFTFAN at presale! ${https://t.co/l6g0wPf8YA}. RT, Like, Follow, drop wallet!",
  "🎉 Win {bonus} & buy $NFTFAN before launch! Pre Sale: ${https://t.co/l6g0wPf8YA}. NFTFAN = fan economy 🚀 RT, Like, Follow, drop wallet!",
  "Drop wallet below for surprise {bonus} airdrop! NFTFAN = token + Subfan subscriptions. RT, Like, Follow!",
  "Retweet, Like, Follow @nftfanstoken for {bonus}! NFTFAN jobs = senders + hunters 🍀 Drop wallet!",
  "Let’s make your wallet happy! Drop wallet, RT, Like, Follow @nftfanstoken for {bonus} + learn Subfan.",
  "💎 Loyal followers get {bonus} – NFTFAN = project + ecosystem 🚀 RT, Like, Follow, drop wallet!",
  "🥳 Airdrop celebration: {bonus} – NFTFAN = more than tokens, it’s fan-powered jobs. RT, Like, Follow, drop wallet!",
  "🚨 $NFTFAN Pre-sale now: ${https://t.co/l6g0wPf8YA}. Win {bonus} + join Subfan economy. RT, Like, Follow, drop wallet!",
  "🟢 Early supporters win {bonus}. TG ${https://t.co/F9oH6XDQlr} + presale ${https://t.co/l6g0wPf8YA}. NFTFAN = hunters + senders. RT, Like, Follow, drop wallet!",
  "Drop wallet, RT, Like, Follow @nftfanstoken for {bonus} + discover NFTFAN jobs + Subfan surprises 🚀"
];

// Get a random promo tweet
function getRandomTweetText() {
  const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
  const bonus = getRandomTokenBonus();
  return template.replace(/\{bonus\}/g, bonus);
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





// --- Tweet on Launch ---
postTweet();
postUsernameInviteTweet();

// --- Cron Jobs ---
// Every hour: general NFTFAN promo tweet
cron.schedule('0 * * * *', postTweet);
// Every 20 minutes: username-invite / claim tweet (promotes 5B $NFTFAN claim in TG)
cron.schedule('*/20 * * * *', postUsernameInviteTweet);
