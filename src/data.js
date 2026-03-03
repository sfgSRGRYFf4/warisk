// ============================================================
// WARISK.FUN — GAME DATA
// All territories, shop items, headlines, and events
// ============================================================

// ----------------------------------------------------------
// ATTACKABLE TERRITORIES (12 total)
// ----------------------------------------------------------
export const TERRITORIES = {
  // --- EASY (2-4 troops) ---
  venezuela: {
    name: "Venezuela",
    troops: 3,
    owner: "enemy",
    building: null,
    shield: false,
    irradiated: 0,

    neighbors: ["cuba", "panama", "usa"],
    attackable: true,
    difficulty: "easy",
    excuse: "They have oil AND socialism. Double threat.",
    headlines: [
      "BREAKING: Venezuela's oil nationalized. US takes it personally.",
      "Maduro blinks. Pentagon does not.",
      "US discovers Venezuelan oil tastes like freedom",
      "Operation Bolivarian Liberation: 'It's not about the oil' (it's about the oil)",
    ],
    conqueredMsg: "Venezuela liberated! Oil production now under freedom management.",
  },
  panama: {
    name: "Panama",
    troops: 3,
    owner: "enemy",
    building: null,
    shield: false,
    irradiated: 0,

    neighbors: ["venezuela", "cuba"],
    attackable: true,
    difficulty: "easy",
    excuse: "Our canal, actually",
    headlines: [
      "BREAKING: US reclaims canal 'for maintenance purposes'",
      "Panama reminded who built the canal",
      "Operation Just Cause 2: Just Because",
      "Panama receives surprise freedom delivery",
    ],
    conqueredMsg: "Panama liberated! The canal is ours again.",
  },
  greenland: {
    name: "Greenland",
    troops: 4,
    owner: "enemy",
    building: null,
    shield: false,
    irradiated: 0,

    neighbors: ["usa", "cuba", "libya"],
    attackable: true,
    difficulty: "easy",
    excuse: "Strategic purchase opportunity",
    headlines: [
      "BREAKING: US makes Greenland an offer it can't refuse",
      "Strategic ice acquisition underway -- melting not included",
      "Trump signs order: 'Greenland is American now'",
      "Denmark: 'You can't just buy a--' US: 'Watch us'",
      "Pentagon reclassifies ice as a weapon of mass destruction",
    ],
    conqueredMsg: "Greenland acquired! Art of the Deal: complete.",
  },

  // --- MEDIUM (5-7 troops) ---
  cuba: {
    name: "Cuba",
    troops: 5,
    owner: "enemy",
    building: null,
    shield: false,
    irradiated: 0,

    neighbors: ["venezuela", "panama", "libya", "greenland", "usa"],
    attackable: true,
    difficulty: "medium",
    excuse: "90 miles too close for comfort",
    headlines: [
      "BREAKING: US reminds Cuba it's still too close to Florida",
      "Bay of Pigs 2: Now with drones",
      "Cuba sanctioned for existing within swimming distance",
      "CIA's 638th attempt on Cuba. Maybe this time.",
    ],
    conqueredMsg: "Cuba liberated! Cigars now tax-free.",
  },
  libya: {
    name: "Libya",
    troops: 6,
    owner: "enemy",
    building: null,
    shield: false,
    irradiated: 0,

    neighbors: ["cuba", "greenland", "yemen", "iraq", "syria"],
    attackable: true,
    difficulty: "medium",
    excuse: "Humanitarian intervention",
    headlines: [
      "BREAKING: US assists Libya with unsolicited government renovation",
      "Humanitarian bombs dispatched to Tripoli",
      "NATO confirms: bombing for peace is not an oxymoron",
      "Libya upgraded from 'country' to 'freedom zone'",
    ],
    conqueredMsg: "Libya liberated! Government renovation: complete.",
  },
  yemen: {
    name: "Yemen",
    troops: 5,
    owner: "enemy",
    building: null,
    shield: false,
    irradiated: 0,

    neighbors: ["libya", "iraq", "iran", "somalia"],
    attackable: true,
    difficulty: "medium",
    excuse: "Drone testing grounds",
    headlines: [
      "BREAKING: US drone fleet gets extra practice in Yemen",
      "Yemen selected for premium drone testing program",
      "Pentagon: 'We can't find Yemen on a map but we can bomb it'",
      "Yemen added to 'places we've definitely heard of' list",
    ],
    conqueredMsg: "Yemen liberated! Drone testing: successful.",
  },

  // --- HARD (12 troops) ---
  iraq: {
    name: "Iraq",
    troops: 12,
    owner: "enemy",
    building: "factory",
    shield: false,
    irradiated: 0,

    neighbors: ["libya", "yemen", "iran", "syria", "afghanistan"],
    attackable: true,
    difficulty: "hard",
    excuse: "WMDs (trust us)",
    headlines: [
      "BREAKING: WMDs definitely found this time (source: trust me bro)",
      "US returns to Iraq for sequel nobody asked for",
      "Operation Iraqi Freedom 2: Electric Boogaloo",
      "Pentagon: 'Third time's the charm'",
      "Iraq invasion speedrun -- any% category",
    ],
    conqueredMsg: "Iraq liberated! Democracy installed. Rebooting...",
  },

  // --- BOSS (20 troops, can fire back) ---
  iran: {
    name: "Iran",
    troops: 20,
    owner: "enemy",
    building: "refinery",
    shield: false,
    irradiated: 0,

    neighbors: ["iraq", "yemen", "afghanistan"],
    attackable: true,
    difficulty: "boss",
    excuse: "Nuclear threat",
    headlines: [
      "BREAKING: US launches Operation Epic Fury -- 'They were asking for it' says Pentagon",
      "Freedom missiles en route to Tehran -- ETA: now",
      "Iran warned to stop having oil and being in the Middle East",
      "Pentagon: 'This is definitely self-defense' (from 6,000 miles away)",
      "CIA confirms: Iran's vibes were threatening",
    ],
    conqueredMsg: "Iran liberated! Nuclear program replaced with freedom program.",
  },

  // --- NEW TERRITORIES ---
  syria: {
    name: "Syria",
    troops: 5,
    owner: "enemy",
    building: null,
    shield: false,
    irradiated: 0,
    neighbors: ["libya", "iraq"],
    attackable: true,
    difficulty: "medium",
    excuse: "Chemical weapons (probably)",
    headlines: [
      "BREAKING: US intervenes in Syria for the 47th time",
      "Pentagon draws red line. Then another. Then another.",
      "Syria receives unsolicited urban renovation via airstrike",
      "Rebel groups #1 through #47 all claim US support",
    ],
    conqueredMsg: "Syria liberated! Red lines: finally enforced.",
  },
  afghanistan: {
    name: "Afghanistan",
    troops: 14,
    owner: "enemy",
    building: "factory",
    shield: false,
    irradiated: 0,
    neighbors: ["iran", "iraq"],
    attackable: true,
    difficulty: "hard",
    excuse: "Graveyard of empires? Challenge accepted.",
    headlines: [
      "BREAKING: US returns to Afghanistan. 'Third time's the charm'",
      "Pentagon: 'We left some stuff there. Going back to get it.'",
      "Operation Enduring Freedom 2: We Never Learn",
      "Afghanistan campaign enters year 1. Again.",
    ],
    conqueredMsg: "Afghanistan liberated! (for approximately 6 months)",
  },
  north_korea_t: {
    name: "North Korea",
    troops: 16,
    owner: "enemy",
    building: "factory",
    shield: true,
    irradiated: 0,
    neighbors: ["usa"],
    attackable: true,
    difficulty: "boss",
    excuse: "They have nukes, memes AND a missile shield",
    headlines: [
      "BREAKING: US launches operation against North Korea. Dennis Rodman unavailable for comment.",
      "Kim Jong Un challenges US to basketball. Pentagon considers it.",
      "DPRK state media: 'We will destroy you.' US: 'New phone who dis'",
      "Operation Rocket Man: Pentagon names it ironically",
    ],
    conqueredMsg: "North Korea liberated! Dear Leader replaced with Dear Democracy.",
  },
  somalia: {
    name: "Somalia",
    troops: 3,
    owner: "enemy",
    building: null,
    shield: false,
    irradiated: 0,
    neighbors: ["yemen"],
    attackable: true,
    difficulty: "easy",
    excuse: "Pirates. Not the fun kind.",
    headlines: [
      "BREAKING: US sends Navy to fight actual pirates",
      "Black Hawk Down 2: This Time We Brought GPS",
      "Somalia receives surprise coast guard upgrade",
      "Pentagon: 'Pirates are a national security threat now'",
    ],
    conqueredMsg: "Somalia liberated! Piracy now handled by authorized contractors.",
  },
};

// ----------------------------------------------------------
// PLAYER BASE (starting territory — USA)
// ----------------------------------------------------------
export const PLAYER_BASE = {
  usa: {
    name: "United States",
    troops: 8,
    owner: "player",
    building: null,
    shield: false,
    irradiated: 0,

    neighbors: ["cuba", "greenland", "venezuela", "north_korea_t"],
    attackable: false,
    difficulty: null,
    excuse: null,
    headlines: [],
    conqueredMsg: null,
  },
};

// ----------------------------------------------------------
// ALLIED COUNTRIES (green, clickable for bonus)
// ----------------------------------------------------------
export const ALLIES = {
  israel: {
    name: "Israel",
    owner: "ally",
    troops: 0,
    building: null,
    shield: false,
    irradiated: 0,

    neighbors: [],
    attackable: false,
    difficulty: null,
    excuse: null,
    headlines: [],
    conqueredMsg: null,
    clickMessage: "Israel sends Ⓦ50 in 'foreign aid'. Don't ask where it came from.",
    cooldown: 0,
  },
};

// ----------------------------------------------------------
// NON-ATTACKABLE COUNTRIES (humor labels on hover)
// ----------------------------------------------------------
export const NEUTRAL_LABELS = {
  canada:      { name: "Canada",      label: "Friendly neighbor (for now)",        x: 130, y: 100 },
  mexico:      { name: "Mexico",      label: "The Wall DLC coming soon",           x: 120, y: 280 },
  uk:          { name: "UK",          label: "Obedient ally",                      x: 265, y: 120 },
  france:      { name: "France",      label: "Surrendered before we asked",        x: 270, y: 150 },
  germany:     { name: "Germany",     label: "Redemption arc complete",            x: 300, y: 135 },
  italy:       { name: "Italy",       label: "Protected for the pizza",            x: 290, y: 170 },
  spain:       { name: "Spain",       label: "Spring break location",              x: 250, y: 175 },
  portugal:    { name: "Portugal",    label: "Spain 2",                            x: 235, y: 165 },
  sweden:      { name: "Sweden",      label: "What do they even do?",              x: 310, y: 110 },
  finland:     { name: "Finland",     label: "Sounds fake",                        x: 355, y: 110 },
  norway:      { name: "Norway",      label: "Like Greenland but not for sale",    x: 285, y: 105 },
  switzerland: { name: "Switzerland", label: "Has our money, can't touch",         x: 285, y: 160 },
  japan:       { name: "Japan",       label: "We already handled this (1945)",     x: 700, y: 185 },
  australia:   { name: "Australia",   label: "Too far to care",                    x: 680, y: 400 },
  brazil:      { name: "Brazil",      label: "Not sure where this is",             x: 210, y: 380 },
  india:       { name: "India",       label: "Call center, do not attack",         x: 535, y: 265 },
  mongolia:    { name: "Mongolia",    label: "???",                                x: 600, y: 140 },
  south_korea: { name: "S. Korea",    label: "Our K-pop base",                     x: 685, y: 200 },
  turkey:      { name: "Turkey",      label: "Frenemy with benefits",              x: 355, y: 185 },
  egypt:       { name: "Egypt",       label: "Pyramid guard duty",                 x: 320, y: 275 },
  saudi:       { name: "Saudi Arabia",label: "Best friend (don't ask why)",        x: 380, y: 340 },
  russia:      { name: "Russia",      label: "DLC: Cold War 2 (coming 2027)",      x: 510, y: 80  },
  china:       { name: "China",       label: "Final Boss (Season 2)",              x: 610, y: 210 },
  argentina:   { name: "Argentina",   label: "Who?",                               x: 200, y: 440 },
  south_africa:{ name: "S. Africa",   label: "Exists, probably",                   x: 350, y: 420 },
  colombia:    { name: "Colombia",    label: "It's complicated",                   x: 155, y: 330 },
  new_zealand: { name: "New Zealand", label: "Literally forgot this exists",       x: 740, y: 440 },
  thailand:    { name: "Thailand",    label: "R&R for the troops",                 x: 620, y: 280 },
  poland:      { name: "Poland",      label: "Loyal sidekick, always shows up",    x: 330, y: 125 },
  greece:      { name: "Greece",      label: "Broke but strategic",                x: 315, y: 195 },
  kuwait:      { name: "Kuwait",      label: "We already saved this one. You're welcome.", x: 530, y: 278 },
  // --- NEW NEUTRAL COUNTRIES ---
  // north_korea is now a territory (north_korea_t)
  pakistan:     { name: "Pakistan",    label: "Frenemy. Mostly enemy.",              x: 560, y: 250 },
  // afghanistan is now a territory
  nigeria:     { name: "Nigeria",     label: "Nigerian prince still owes us money", x: 375, y: 310 },
  indonesia:   { name: "Indonesia",   label: "Largest Muslim country. Somehow not invaded yet.", x: 645, y: 340 },
  vietnam:     { name: "Vietnam",     label: "We don't talk about this either",    x: 635, y: 270 },
  ukraine:     { name: "Ukraine",     label: "Currently subscribed to Freedom Premium", x: 365, y: 145 },
  philippines: { name: "Philippines", label: "US naval base disguised as an ally",  x: 680, y: 290 },
  peru:        { name: "Peru",        label: "The other country with ancient stuff", x: 175, y: 370 },
  chile:       { name: "Chile",       label: "The thin one",                        x: 185, y: 420 },
  myanmar:     { name: "Myanmar",     label: "We can't even spell this one",        x: 610, y: 270 },
  // syria and somalia are now territories
  sudan:       { name: "Sudan",       label: "Location: Africa. Details: classified.", x: 420, y: 290 },
  ethiopia:    { name: "Ethiopia",    label: "Coffee origin. Off limits.",           x: 440, y: 310 },
  congo:       { name: "Congo",       label: "We're 'helping'",                     x: 390, y: 355 },
  // --- BATCH 3 ---
  guatemala:   { name: "Guatemala",   label: "1954 called. CIA answered.",           x:  88, y: 262 },
  honduras:    { name: "Honduras",    label: "Banana republic. Literally.",          x: 107, y: 272 },
  haiti:       { name: "Haiti",       label: "The one we 'help' every 10 years.",   x: 165, y: 258 },
  denmark:     { name: "Denmark",     label: "Currently ignoring our Greenland calls.", x: 292, y: 112 },
  ireland:     { name: "Ireland",     label: "Neutral. We respect it. Mostly.",     x: 247, y: 128 },
  romania:     { name: "Romania",     label: "Dracula country. Also in NATO.",       x: 346, y: 163 },
  kazakhstan:  { name: "Kazakhstan",  label: "Borat's home. Confirmed real place.", x: 528, y: 155 },
  bolivia:     { name: "Bolivia",     label: "We did a coup here. CIA: 'Classic.'", x: 193, y: 390 },
  kenya:       { name: "Kenya",       label: "Obama birthplace. Still investigating.", x: 428, y: 342 },
  zimbabwe:    { name: "Zimbabwe",    label: "Invented the 100 trillion dollar bill. Relatable.", x: 388, y: 398 },
  nepal:       { name: "Nepal",       label: "Everest: for rich people who need a personality.", x: 568, y: 248 },
  morocco:     { name: "Morocco",     label: "France's ex. Not our problem.",        x: 248, y: 227 },
};

// ----------------------------------------------------------
// SHOP ITEMS
// ----------------------------------------------------------
export const SHOP = {
  troop: {
    name: "Troop",
    cost: 30,
    icon: "User",
    desc: "Brave volunteer (enlisting bonus: Ⓦ0)",
    action: "deploy",
    phase: "build",
  },
  factory: {
    name: "Factory",
    cost: 100,
    icon: "Factory",
    desc: "Lockheed Martin subsidiary",
    action: "build_structure",
    income: 4,
    phase: "build",
  },
  refinery: {
    name: "Refinery",
    cost: 250,
    icon: "Fuel",
    desc: "Definitely not why we invaded",
    action: "build_structure",
    income: 10,
    phase: "build",
  },
  shield: {
    name: "Missile Shield",
    cost: 200,
    icon: "Shield",
    desc: "Iron Dome but expensive",
    action: "defend",
    phase: "build",
  },
  drone: {
    name: "Drone Strike",
    cost: 120,
    icon: "Plane",
    desc: "Piloted from a basement in Virginia",
    action: "strike",
    damage: [1, 2],
    phase: "strike",
  },
  missile: {
    name: "Tactical Missile",
    cost: 250,
    icon: "Rocket",
    desc: "Made in USA (assembled in China)",
    action: "strike",
    damage: [3, 5],
    phase: "strike",
  },
  nuke: {
    name: "Nuclear Strike",
    cost: 800,
    icon: "Radiation",
    desc: "For defensive purposes only (wink)",
    action: "strike",
    damage: "all",
    phase: "strike",
  },
  sanctions: {
    name: "Sanctions",
    cost: 80,
    icon: "FileText",
    desc: "Destroys enemy building (requires target with factory/refinery)",
    action: "debuff",
    phase: "strike",
  },
  un_resolution: {
    name: "UN Resolution",
    cost: 0,
    icon: "Landmark",
    desc: "Thoughts and prayers",
    action: "nothing",
    phase: "strike",
  },
};

// ----------------------------------------------------------
// GENERIC ATTACK HEADLINES (any attack)
// ----------------------------------------------------------
export const GENERIC_HEADLINES = [
  "US military budget finally justified",
  "Congress approves war they'll pretend to oppose later",
  "Oil discovered in {country}. What a coincidence.",
  "Lockheed Martin stock up 12% on the news",
  "Pentagon: 'This was definitely self-defense'",
  "CNN breaking: War is good, actually",
  "Defense contractor CEOs pop champagne",
  "UN condemns attack. US: 'lol k'",
  "Freedom isn't free. It costs about 150 ⓌARISK per missile.",
  "Another country added to the freedom delivery route",
  "Pentagon discovers oil under children's hospital. Declares it a military target.",
  "War crimes? We call those 'enhanced freedom techniques.'",
  "CIA accidentally coups the wrong country. Decides to keep it.",
  "Raytheon CEO sends Pentagon a thank-you basket.",
  "Bombing resumes after brief snack break.",
];

// ----------------------------------------------------------
// CONQUEST MESSAGES
// ----------------------------------------------------------
export const CONQUEST_MESSAGES = [
  "{country} has been liberated! Freedom installation: 100%",
  "Democracy successfully installed in {country}. Rebooting...",
  "Another country freed from the tyranny of self-governance",
  "{country} is now a proud recipient of American Values",
  "Mission Accomplished! (for real this time)",
  "{country} upgraded to 'US-approved government'",
  "{country} didn't want democracy. Got it anyway. You're welcome.",
  "Regime change in {country} complete. New puppet -- er, president installed.",
  "{country} now has freedom. Side effects may include rubble.",
  "Another star for the flag. Manifest Destiny 2.0.",
];

// ----------------------------------------------------------
// DEFENSE HEADLINES (when player gets attacked)
// ----------------------------------------------------------
export const DEFENSE_HEADLINES = [
  "INCOMING: {country} fights back -- How dare they!",
  "Your troops were hit -- This wasn't in the brochure",
  "Enemy attacked -- Pentagon: 'Unprovoked aggression!'",
  "{country} launched missiles at you. The audacity.",
  "You lost troops. Press secretary: 'minimal casualties'",
  "Soldier returns home to find VA wait time is 6 months. Re-enlists.",
  "Pentagon intern accidentally leaks troop positions on X. Casualties follow.",
  "Troops complain MREs taste worse than the enemy's cooking.",
  "{country} fights back. Fox News calls it terrorism.",
];

// ----------------------------------------------------------
// RANDOM EVENTS (30% chance between turns)
// ----------------------------------------------------------
export const EVENTS = [
  { text: "Oil prices spike! Double income this turn",                                        effect: "double_income" },
  { text: "Congress approves emergency budget. +150 ⓌARISK",                                 effect: "add_150" },
  { text: "Wikileaks leaks your battle plans. All enemies +1 troop",                          effect: "enemy_plus1" },
  { text: "Defense contractor donates to campaign. +100 ⓌARISK",                             effect: "add_100" },
  { text: "UN Security Council meets. Russia vetoes. Nothing changes.",                       effect: "none" },
  { text: "Soldier posts TikTok from warzone. Recruitment surge! +2 troops to random territory", effect: "recruit_2" },
  { text: "Gas prices hit $9/gallon. Public approval drops. (doesn't affect gameplay)",       effect: "none" },
  { text: "CIA accidentally funds wrong rebel group. -50 ⓌARISK",                            effect: "lose_50" },
  { text: "War movie greenlit based on your campaign. +80 ⓌARISK",                           effect: "add_80" },
  { text: "Oil company sponsors your next missile. Next missile is FREE",                     effect: "free_missile" },
  { text: "Your approval rating is 12%. Doesn't affect gameplay at all.",                     effect: "none" },
  { text: "Area 51 sends experimental tech. Free nuke!",                                     effect: "free_nuke" },
  { text: "Journalist asks tough question at briefing. Ignored.",                             effect: "none" },
  { text: "Veterans protest war. Media ignores. +0 effect.",                                  effect: "none" },
  { text: "Ally sends 'thoughts and prayers'. Thanks for nothing.",                           effect: "none" },
  { text: "Drone operator gets kill streak bonus. Unlocks new skin.",                         effect: "add_80" },
  { text: "Pentagon finds $35B in the couch cushions. +150 ⓌARISK",                          effect: "add_150" },
  { text: "War profiteering investigation launched. Immediately dropped. +100 ⓌARISK",       effect: "add_100" },
  { text: "Whistleblower flees to Russia. Your plans leaked. All enemies +1 troop",           effect: "enemy_plus1" },
  { text: "Military-industrial complex sends holiday card with $100 gift card",               effect: "add_100" },
  // --- 30 NEW DARK HUMOR EVENTS ---
  { text: "Pentagon discovers oil under children's hospital. +100 ⓌARISK",                   effect: "add_100" },
  { text: "Predator drone pilot earns Employee of the Month. +80 ⓌARISK",                     effect: "add_80" },
  { text: "CIA accidentally coups the wrong country. Free troops!",                           effect: "recruit_2" },
  { text: "Soldier returns home, VA wait is 6 months. Re-enlists.",                           effect: "none" },
  { text: "War crimes renamed to 'enhanced freedom techniques'. Morale up!",                  effect: "add_80" },
  { text: "Defense contractor stock hits all-time high. +150 ⓌARISK",                        effect: "add_150" },
  { text: "UN writes strongly-worded letter. Everyone ignores it.",                            effect: "none" },
  { text: "Fox News declares war on country that doesn't exist.",                              effect: "none" },
  { text: "Lockheed Martin sends you a thank-you basket. +100 ⓌARISK",                       effect: "add_100" },
  { text: "WikiLeaks releases your browser history. Mostly cat videos.",                       effect: "none" },
  { text: "Congress approves $800B defense budget. Schools get $12. +150 ⓌARISK",             effect: "add_150" },
  { text: "Halliburton wins no-bid contract for rebuilding. +80 ⓌARISK",                     effect: "add_80" },
  { text: "Embedded journalist accidentally tells the truth. Fired immediately.",              effect: "none" },
  { text: "Arms exports reach all-time high. Double income this turn!",                        effect: "double_income" },
  { text: "Geneva Convention? More like Geneva Suggestion.",                                   effect: "none" },
  { text: "Blackwater rebrands again. Now called 'Freedom Friends.' +80 ⓌARISK",             effect: "add_80" },
  { text: "Patriot Act renewed. Freedom has never been more monitored.",                       effect: "none" },
  { text: "Draft dodger becomes Commander in Chief. Again.",                                   effect: "none" },
  { text: "Boeing sends complimentary jet fuel samples. +100 ⓌARISK",                         effect: "add_100" },
  { text: "Classified docs found in fast food bathroom. Enemies +1 troop",                    effect: "enemy_plus1" },
  { text: "Friendly fire incident blamed on 'fog of war'. -50 ⓌARISK",                       effect: "lose_50" },
  { text: "Regime change successful. New regime somehow worse.",                               effect: "none" },
  { text: "NATO meeting turns into group therapy session.",                                    effect: "none" },
  { text: "Veterans protest. Media covers celebrity divorce instead.",                         effect: "none" },
  { text: "Collateral damage report reclassified as 'statistics'.",                            effect: "none" },
  { text: "Arms dealer wins Nobel Peace Prize nomination. +80 ⓌARISK",                       effect: "add_80" },
  { text: "Propaganda department rebrands as 'Public Relations'.",                             effect: "none" },
  { text: "Sanctions hurt civilians. Mission accomplished.",                                   effect: "none" },
  { text: "Enemy combatant was actually a wedding party. -50 ⓌARISK",                        effect: "lose_50" },
  { text: "Intelligence report was just a Wikipedia article. Enemies +1 troop",               effect: "enemy_plus1" },
];

// ----------------------------------------------------------
// NEWS TICKER (scrolling headlines for menu/game)
// ----------------------------------------------------------
export const TICKER_HEADLINES = [
  "Pentagon requests $900B budget increase 'for office supplies'",
  "CIA denies existence of CIA",
  "US military conducts 'routine' exercise near 7 countries simultaneously",
  "Lockheed Martin reports record profits. Coincidence, surely.",
  "Congress votes to name post office. War budget passes unread.",
  "Study finds 90% of Americans can't find Yemen on a map. Bombing proceeds.",
  "UN issues strongly worded letter. Pentagon uses it as coaster.",
  "Oil prices rise. Pentagon suddenly concerned about human rights abroad.",
  "Defense contractor wins contract to build $400 coffee mug",
  "Diplomat accidentally tells truth at press conference. Fired immediately.",
  "Classified documents found at Arby's. Again.",
  "Military spending exceeds GDP of 180 countries combined",
  "Troops deployed to protect freedom. Location: classified. Reason: also classified.",
  "New aircraft carrier costs $13B. Cafeteria still serves bad coffee.",
  "Whistleblower reports waste. Report classified. Whistleblower relocated.",
  "Pentagon discovers oil under children's hospital. Declares it a military target.",
  "Drone operator gets kill streak bonus. Unlocks new skin.",
  "War crimes? We call those 'enhanced freedom techniques.'",
  "CIA accidentally coups the wrong country. Decides to keep it.",
  "Soldier returns home to find VA wait time is 6 months. Re-enlists.",
  "Congress member trades defense stocks before vote. Calls it 'research.'",
  "Pentagon: 'We lost $21 trillion but found $300 in a vending machine.'",
  "Military recruiter promises free college. Terms and conditions: war.",
  "Raytheon sponsors Little League team. 'Investing in the future.'",
  "General retires. Becomes defense contractor lobbyist by lunch.",
  "VA hospital wait time now longer than actual deployment.",
  "Pentagon audit fails for 7th year. 'We'll get it next time.'",
];

// ----------------------------------------------------------
// TITLE RANKS (based on turns to win)
// ----------------------------------------------------------
export const TITLES = [
  { maxTurns: 12, title: "Commander in Chief", stars: 5 },
  { maxTurns: 18, title: "Secretary of Defense", stars: 4 },
  { maxTurns: 24, title: "CIA Director", stars: 3 },
  { maxTurns: 30, title: "Army General", stars: 2 },
  { maxTurns: 40, title: "Pentagon Intern", stars: 1 },
  { maxTurns: Infinity, title: "UN Peacekeeper (ironic)", stars: 0 },
];

// ----------------------------------------------------------
// HELPER: get title based on turns
// ----------------------------------------------------------
export function getTitle(turns) {
  for (const rank of TITLES) {
    if (turns <= rank.maxTurns) return rank;
  }
  return TITLES[TITLES.length - 1];
}

// ----------------------------------------------------------
// HELPER: pick random item from array
// ----------------------------------------------------------
export function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ----------------------------------------------------------
// HELPER: random int in range [min, max] inclusive
// ----------------------------------------------------------
export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ----------------------------------------------------------
// HELPER: create initial game territories (deep copy)
// ----------------------------------------------------------
export function createInitialTerritories() {
  const all = {};
  // Player base
  for (const [id, t] of Object.entries(PLAYER_BASE)) {
    all[id] = { ...t };
  }
  // Enemy territories
  for (const [id, t] of Object.entries(TERRITORIES)) {
    all[id] = { ...t };
  }
  // Allies
  for (const [id, t] of Object.entries(ALLIES)) {
    all[id] = { ...t };
  }
  return all;
}

// ----------------------------------------------------------
// SHARE JOKES — dark humor for X/Twitter sharing
// ----------------------------------------------------------
export const VICTORY_JOKES = {
  5: [
    "Speedran imperialism. Any% world record.",
    "Geneva Convention? More like Geneva Suggestion.",
    "Manifest Destiny 2.0 completed before lunch.",
    "Built different. Built by Raytheon.",
  ],
  4: [
    "Efficient freedom delivery. 5 stars on Yelp.",
    "Pentagon wants to hire me. Benefits include: oil.",
    "Democracy installed faster than Windows updates.",
    "Lockheed Martin is naming a missile after me.",
  ],
  3: [
    "Average CIA Tuesday.",
    "Not bad for a country that can't find Yemen on a map.",
    "Congress approved this without reading it. As usual.",
    "Mission accomplished! (for real this time)",
  ],
  2: [
    "Slow but the oil was worth it.",
    "My approval rating is lower than my turn count.",
    "Even the Pentagon intern could've done this faster.",
  ],
  1: [
    "UN would be proud of this pace.",
    "Took so long, the war became a documentary.",
    "At least nobody noticed the war crimes.",
  ],
  0: [
    "UN would be proud of this pace.",
    "Took so long, the war became a trilogy.",
    "They'll make a Netflix series about how long this took.",
  ],
};

export const DEFEAT_JOKES = [
  "The homeland fell and all I got was this tweet.",
  "Even France lasted longer.",
  "My military strategy? 'Vibes.'",
  "Lost to countries I can't find on a map.",
  "The troops are requesting a new commander. Via HR.",
  "Pentagon is pretending this never happened.",
];

export const ISRAEL_MESSAGES = [
  "Hey, remember that $3.8B we lent you? Just kidding, you gave it to us.",
  "Iron Dome upgrade available. Only $500M. Friend price.",
  "We 'accidentally' bombed your enemy. You're welcome.",
  "Mossad found your enemy's search history. It's embarrassing.",
  "Settlement expansion complete. Wait, wrong chat.",
  "Intel report: your enemy's hummus is inferior.",
  "We neither confirm nor deny having nukes. *wink*",
  "Shalom! Your annual foreign aid package has arrived.",
];
