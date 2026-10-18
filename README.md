# Khoj

Curiosity badhane wala browser game. Isme asli facts, asli business cases, aur tumhara apna data hai.
Points sahi hone pe nahi milte. Points sawal banane aur check karne pe milte hain.

```
game/                      → GitHub Pages pe jaata hai
  index.html               poora game (inline CSS + JS), koi build step nahi
  facts.json               built-in cards (Mode 1: 18, Mode 3: 40)
  admin.html               Fact Factory + reported cards (admin token se)
  topics.json              Fact Factory ke topics
  manifest.webmanifest, sw.js, icons/   PWA (phone pe app jaisa, offline)
  sample/SAMPLE_nakli_restaurant_sales.csv   NAKLI data, sirf Mode 4 try karne ke liye
worker/                    → Cloudflare pe alag deploy
  src/index.js             AI helper, kharcha, budget, access code, sync, Fact Factory
  src/evidence.js          evidence check (code se, AI se nahi)
  prices.js                saare rates ek jagah
  wrangler.toml
scripts/fact-factory.md    naye cards banane ke steps
.github/workflows/pages.yml  main pe push = game auto deploy
```

> **Warning:** repo mein kabhi mat daalna: API keys, `.env`, `.dev.vars`, koi bhi asli sales CSV ya business data. `.gitignore` ye sab rokta hai. Pages workflow bhi deploy se pehle key ya CSV milne pe ruk jaata hai.

## 1. Kaunse secrets set karne hain

Ye chaaron sirf Worker secrets mein jaate hain. Kisi file, git ya frontend mein nahi.

| Secret | Kya hai |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API key (console.anthropic.com) |
| `GEMINI_API_KEY` | Gemini key, billing ON (Google Search grounding ke liye zaroori) |
| `ACCESS_CODE` | game ke AI buttons ka code. Jinhe dena ho unhe batao |
| `ADMIN_TOKEN` | admin.html ka password. Lamba aur random rakho, kisi ko mat do |

## 2. Commands (pehli baar)

```bash
cd worker
npm install
npx wrangler login
npx wrangler kv namespace create KV
```

Ye command ek `id` dikhayegi. Use `wrangler.toml` mein `PASTE_KV_NAMESPACE_ID_HERE` ki jagah daalo. Usi file mein `ALLOWED_ORIGINS` mein `USERNAME` ki jagah apna GitHub username daalo.

```bash
npx wrangler secret put ANTHROPIC_API_KEY
```

```bash
npx wrangler secret put GEMINI_API_KEY
```

```bash
npx wrangler secret put ACCESS_CODE
```

```bash
npx wrangler secret put ADMIN_TOKEN
```

```bash
npx wrangler deploy
```

Deploy ke baad Worker ka URL milega, jaise `https://khoj-ai.<naam>.workers.dev`.

**Game ko Worker URL batao:** `game/index.html` mein upar `CONFIG.WORKER_URL` mein ye URL daal do. Isse har device pe URL apne aap aa jaayega. Ya har device pe **Mera → Settings → AI** mein URL daal sakte ho. Game pehli baar khulne pe ek baar access code maangta hai.

## 3. GitHub Pages pe game

1. GitHub pe repo banao aur code push karo (`main` branch).
2. Repo mein **Settings → Pages → Source: GitHub Actions** chuno.
3. Ab har push pe `.github/workflows/pages.yml` `game/` folder deploy karta hai. URL hoga `https://<username>.github.io/<repo>/`.
4. Saare paths relative hain (`./facts.json`), isliye sub-path pe bhi chalta hai.

**Phone pe app jaisa:**
- Android Chrome: menu → "Add to Home screen".
- iPhone Safari: Share → "Add to Home Screen".

Offline (airplane mode) mein Mode 1, 3, 4 aur Bahar ki Khoj chalte hain; sirf AI band hota hai. Naya version deploy karo to `game/sw.js` mein `VERSION` badal do, taaki purana cache hat jaaye.

## 4. Kharcha aur limits

- Har AI jawab ke neeche dikhta hai: "Is jawab ka kharcha: ₹…". Round ke end mein round ka total aata hai, aur Home pe pichhle session ka total.
- **Mera → Kharcha** screen dikhati hai:
  - aaj, is hafte aur is mahine ka kharcha
  - per round average
  - mahine ke budget mein se kitna bacha (progress bar)
  - Gemini ki search count / 5,000
- Rates `worker/prices.js` mein hain. ₹ ka rate (default 88) Settings se badal sakte ho.
- Worker ke caps `wrangler.toml` ke `[vars]` mein hain:

  | Variable | Default |
  |---|---|
  | `CLAUDE_MONTHLY_BUDGET_USD` | 0.50 |
  | `GEMINI_MONTHLY_BUDGET_USD` | 0.50 |
  | `GEMINI_MONTHLY_SEARCH_LIMIT` | 1000 |
  | `FACTORY_DAILY_LIMIT` | 20 |

- Har call se **pehle** Worker check karta hai: is mahine ka kharcha + is call ka max possible kharcha budget se upar jaaye, to call hoti hi nahi. Tab `{ok:false, reason:"budget"}` aata hai, game se AI buttons chhup jaate hain, aur ek line dikhti hai.
- Ek round mein max 3 AI calls ho sakti hain, aur per IP per din 40.
- Mahina badalte hi counters apne aap naye ho jaate hain (`spend:{provider}:{YYYY-MM}`).
- Admin: `GET /kharcha` (header `x-admin-token`) se mahine ka hisaab milta hai.

### Provider ki taraf se suraksha

- **Claude:** Console pe sirf prepaid credits daalo (jaise $1), aur **auto-reload OFF** rakho. Credits khatam hone pe API khud ruk jaati hai, extra bill nahi aata.
- **Gemini:** Google billing postpaid hai. Google Cloud mein Budget alert bana lo (jaise ₹100). Lekin ye alert **sirf email bhejta hai, API band nahi karta**. Asli rok Worker ka `GEMINI_MONTHLY_BUDGET_USD` hai.

## 5. Facts ke niyam aur Fact Factory

- Game khelte waqt koi AI fact nahi banata. Cards sirf `facts.json` aur admin ke approve kiye `approved_facts` (Worker KV) se aate hain.
- Har card pe "Ye galat lag raha hai" (flag icon) button hai. Dabane pe card us device pe chhup jaata hai. Sync ON ho to Worker pe report bhi hota hai.
- Naye cards banane ka tareeka: [scripts/fact-factory.md](scripts/fact-factory.md).

### Jin cards ka `source_url` abhi nahi hai (check karna)

Inme `source` (publication ya record ka naam) bhara hai, lekin URL nahi. Maine sirf wahi URL daale jo khol ke check kiye ki sahi page pe jaate hain. Inke URL dhoondh ke `facts.json` mein `source_url` mein daal do, ya Fact Factory se dobara banao.

| id | source |
|---|---|
| `k01` | Lab mein shahad ki water activity aur pH naapi gayi, aur bacteria daal ke dekha gaya ki wo badhte hain ya nahi. |
| `k02` | Boiling point aur pressure ka rishta lab mein naapa gaya hai. 3500 m pe ye lagbhag 88-89°C aata hai. |
| `k04` | Cornell University ki 2009 study: ek restaurant mein alag-alag menu diye gaye; bina currency nishaan wale menu pe log zyada kharch kiye. |
| `k05` | Harvard Business School ne 2010 mein is system pe case study likhi, dabbawalon ke kaam ko step by step dekh ke. |
| `k08` | Pyramid ke mortar ki radiocarbon dating aur Roman records se dono dates pakki hain. |
| `k09` | Purani Persian aur Arabic shatranj ki kitaabon mein mohron ki chaal likhi mili hai. |
| `k10` | Octopus ke khoon ke chemical analysis se protein aur usme copper pehchana gaya. |
| `k11` | University of Washington (John Marzluff) ki study: 2006 se saalon tak nakaab pehen ke ghoome aur chillaane waale kauve gine. |
| `k12` | Dr. Donald Unger ne 1998 mein journal Arthritis & Rheumatism mein apna result chhapa. |
| `k13` | Gamma spectrometry se kele aur doosre khaane ki radiation naapi gayi hai. |
| `k14` | Sunrise ke records aur longitude ke hisaab se ye farq naapa gaya. Bagan time British zamane se chal raha hai. |
| `k15` | Genetics aur archaeology se mirch ka ghar Mexico-South America nikla. Purani Indian recipes mein kaali mirch hai, mirch nahi. |
| `k16` | 1930s se building pe strikes record kiye gaye (General Electric ki measurements); aaj lightning detection networks ginte hain. |
| `k18` | Johns Hopkins ke scientists ne 2013 mein ullu ki naso mein dye daal ke X-ray (angiography) se dekha. |
| `b01` | Nirma Ltd. company history; Karsanbhai Patel ke published interviews |
| `b03` | Lok Sabha records, 1977 (Industries Minister George Fernandes ka bayan); Coca-Cola India company history |
| `b04` | FSSAI order, 5 June 2015; Nestlé India press releases; Bombay High Court order, Aug 2015 |
| `b06` | McDonald's India company history (pehla restaurant Basant Lok, Delhi, 1996) |
| `b07` | GCMMF (Amul) annual reports; NDDB records |
| `b08` | Zomato DRHP (2021); Zomato company history |
| `b09` | Netflix company history; Netflix SEC filings |
| `b10` | Tata Motors press statement, 3 Oct 2008 |
| `b11` | Reliance Industries AGM (Sept 2016) aur Jio press releases |
| `b13` | Swiggy DRHP (2024); Swiggy company history |
| `b14` | Hindustan Unilever annual reports (Project Shakti) |
| `b15` | Coca-Cola India statements (1993 acquisition; 2021 billion-dollar brand announcement) |
| `b16` | Bisleri International company history |
| `b19` | Flipkart company history |
| `b20` | Maharashtra FDA action (Oct 2003); Cadbury India statements, news archives 2003-04 |
| `b21` | DGCA order, 20 Oct 2012 |
| `b23` | Govt of India (DIPAM) disinvestment records; Tata Group history |
| `b26` | CSE report (Aug 2003); JPC report, Feb 2004 |
| `b27` | Nokia company history |
| `b28` | Nintendo company history |
| `b29` | Starbucks company history |
| `b30` | The Coca-Cola Company history ("The Real Story of New Coke") |
| `b31` | Johnson & Johnson company history; US FDA records |
| `b32` | Kevin Systrom aur Mike Krieger ke interviews; Instagram company history |
| `b33` | Stewart Butterfield ke statements; Slack company history |
| `b34` | IKEA company history (Lövet table, 1956) |
| `b35` | New York Times, Dec 1993; Domino's statement |
| `b36` | McDonald's Corporation history |
| `b38` | The Coca-Cola Company archives (1915 contour bottle) |
| `b39` | The Coca-Cola Company history |
| `b40` | Wrigley Company history (Mars Wrigley) |

## 6. Local test

```bash
cd game && python -m http.server 8765
```

```bash
cd worker && cp .dev.vars.example .dev.vars && npx wrangler dev
```

`.dev.vars` mein test keys daalo; ye file gitignored hai. Game ki Settings mein `http://localhost:8787` daalo.

Windows note: agar `wrangler dev` "workerd.exe ENOENT" ya "Filename too long" de, to project ko chhote path wale folder mein rakho (jaise `C:\code\khoj`).

Fact Factory evidence check source pages fetch karta hai. Bade pages pe free Workers plan ki CPU limit lag sakti hai; zyada use ho to Workers Paid plan behtar hai.

## 7. Data aur privacy

- Game state `localStorage` mein rehta hai, aur sales data `IndexedDB` mein, sirf is browser mein.
- **Mera Business ka data kabhi kahin nahi jaata**: na Worker, na AI, na Gemini, na sync.
- **Settings → Backup download / restore** se ek device se doosre pe progress le ja sakte ho. Restore se pehle confirm screen aati hai.
- **Settings → Sync** (optional): progress Worker KV mein jaati hai, last-write-wins. Worker se laane se pehle confirm hota hai.
- Reminder default band hai. Haptics Settings se band ho sakte hain. Sound default band hai.
