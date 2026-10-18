# Fact Factory: naye cards kaise banein

Fact Factory game ke bahar chalti hai. Gemini (`gemini-3.1-flash-lite`) Google Search se ek fact dhoondhta hai. Phir Worker ka code khud har evidence sentence ko source page pe check karta hai; ye check AI nahi karta. Jo card is check mein pass ho, woh draft ban jaata hai. Game mein card sirf tab aata hai jab tum use **Approve** karo.

## Ek baar ka setup

1. Gemini API key lo (Google AI Studio). Google Search grounding sirf **billing wali** key pe chalta hai.
2. Worker mein secrets daalo:

   ```bash
   cd worker
   npx wrangler secret put GEMINI_API_KEY
   npx wrangler secret put ADMIN_TOKEN
   ```

   `ADMIN_TOKEN` koi bhi lamba random password rakho, jaise 30+ characters. Ise kisi ko mat do.
3. Model badalna ho to `worker/src/index.js` mein upar `GEMINI_MODEL` badlo, aur uska rate `worker/prices.js` mein daalo.

## Topics kaise add karein

`game/topics.json` mein ek line jodo:

```json
{"name": "Haldiram bhujia", "mode": 3, "category": "branding"}
```

- `mode`: 1 = Khoj Yatra (general fact), 3 = Business Khoj.
- `category`: game ki category, jaise `khaana`, `science`, `jaanwar`, `pricing`, `pivot`, `crisis`.
- Ek batch mein max 20 topics chalte hain, aur din mein bhi max 20 (`FACTORY_DAILY_LIMIT`).
- Jo topic pehle ho chuka hai, ya jiska observation kisi purane card se milta hai, woh apne aap skip ho jaata hai.

## admin.html kholna

1. Game ke saath hi khulta hai: `https://<username>.github.io/<repo>/admin.html`. Local test ke liye `http://localhost:8765/admin.html`.
2. Worker URL aur Admin token daalo, phir **Kholo** dabao.

## Batch chalana

1. Topics pe tick lagao, ya neeche ek naya topic likh do.
2. **Batch chalao** dabao. Har topic ka result dikhega:
   - `draft`: evidence pass hua, card neeche Drafts mein aa gaya.
   - `rejected`: koi evidence sentence source page pe nahi mila (90% se kam match), ya page khula hi nahi. Reason log mein dikhta hai.
   - `skip`: Gemini ko achha fact nahi mila.
   - `duplicate`: topic ya observation pehle se hai.
   - `budget`: is mahine ka Gemini budget ya search limit khatam ho gayi.
3. Har card ka kharcha (USD aur ₹) aur batch ka total wahin dikhta hai.

## Approve karna

Har draft mein observation, sahi answer, saal, evidence sentences (match % ke saath) aur clickable source links dikhte hain.

1. **Source links khol ke khud padho.** Code sirf ye check karta hai ki sentence page pe hai; fact sach mein surprising aur sahi hai ya nahi, ye tumhe dekhna hai.
2. Kuch badalna ho to **Edit** dabao, JSON theek karo, phir **Approve** karo.
3. Approve hone pe:
   - Card Worker ke `approved_facts` mein save hota hai, aur game use apne aap load kar leta hai (facts.json ke saath, id se dedupe).
   - Card ka JSON clipboard mein copy ho jaata hai. Hamesha ke liye rakhna ho to `game/facts.json` ki `cards` list mein paste karke commit karo.
4. Galat lage to **Reject** karo.

## Reported cards

Game mein player "Ye galat lag raha hai" dabata hai to card uske device pe chhup jaata hai. Sync ON ho to card Worker pe bhi report hota hai. admin.html ke Reported section mein:

- **Fix**: JSON theek karo aur save karo. Theek wala card sabke liye purane card ki jagah le leta hai.
- **Hata do**: card game se hat jaata hai, sab devices pe.

## Kharcha aur limits

- Gemini ka har call Worker mein ginta hai: tokens (`usageMetadata`) aur Google search ki ginti.
- `GEMINI_MONTHLY_BUDGET_USD` (default $0.50) aur `GEMINI_MONTHLY_SEARCH_LIMIT` (default 1000) se upar Worker call hi nahi karta.
- Google ki free search limit 5,000/mahina hai, aur ye Gemini 3 aur naye models mein shared hai. Hamari limit 1000 isse kaafi neeche rakhi hai.
- Mode 4 (Mera Business) ka data kabhi Gemini ko nahi jaata. Fact Factory sirf public topics pe chalti hai.
