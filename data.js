// ── Shared Data for Middle-earth Map & Timeline ──────────────────────

// ── Map Dimensions ──────────────────────────────
const IMG_W = 7680;
const IMG_H = 4386;

// ── Category Colors ─────────────────────────────
const COLORS = {
    silmarillion: '#9b59b6',
    hobbit:       '#5b8fb9',
    fellowship:   '#c9a435',
    towers:       '#b85c38',
    king:         '#6a9f5b',
    appendix:     '#7f8c8d'
};

const CATEGORY_LABELS = {
    silmarillion: 'The Silmarillion',
    hobbit:       'The Hobbit',
    fellowship:   'The Fellowship of the Ring',
    towers:       'The Two Towers',
    king:         'The Return of the King',
    appendix:     'Appendices'
};

const CATEGORY_ICONS = {
    silmarillion: '\u2756',
    hobbit:       '\u2302',
    fellowship:   '\u2727',
    towers:       '\u2694',
    king:         '\u2655',
    appendix:     '\u2637'
};

// ── SortKey system ──────────────────────────────
// FA year 1-590 → sortKey = year
// SA year 1-3441 → sortKey = 590 + year
// TA year 1-3021 → sortKey = 4031 + year
// Sub-year precision: add month/100 + day/10000

// ── Event Data ──────────────────────────────────
const events = [
    // ── The Silmarillion ──
    {
        id: "cuivienen",
        name: "Cuivi\u00e9nen \u2014 Awakening of the Elves",
        category: 'silmarillion',
        era: "FA", year: 1, sortKey: 0.5,
        px: 7091, py: 1327,
        description: "Cuivi\u00e9nen, the Water of Awakening, was a bay on the shores of the great inland Sea of Helcar in the far east of Middle-earth. Here the first Elves awoke under starlight, long before the rising of the Sun and Moon. The Valar discovered them and summoned them westward on the Great Journey to Valinor \u2014 though some refused the call and remained, becoming the Avari, the Unwilling.",
        characters: "The first Elves, Orom\u00eb"
    },
    {
        id: "khazad-dum-awakening",
        name: "Khazad-d\u00fbm \u2014 The Awakening of Durin",
        category: 'silmarillion',
        era: "FA", year: 1, sortKey: 1,
        px: 4000, py: 1490,
        description: "Durin the Deathless, eldest of the seven Fathers of the Dwarves, awoke at Mount Gundabad and wandered south to the Mirrormere. There he founded Khazad-d\u00fbm, the greatest mansion of the Dwarves, which endured through all the ages until the Balrog was awakened in its depths.",
        characters: "Durin the Deathless"
    },
    {
        id: "ered-luin",
        name: "Ered Luin \u2014 Nogrod & Belegost",
        category: 'silmarillion',
        era: "FA", year: 50, sortKey: 50,
        px: 2192, py: 824,
        description: "The Blue Mountains housed the great Dwarven cities of Nogrod and Belegost in the First Age. The Dwarves of Nogrod crafted the Nauglam\u00edr and later sacked Doriath to reclaim it. After the ruin of Beleriand, many Dwarves migrated east to Khazad-d\u00fbm.",
        characters: "Durin's Folk, the Firebeards, the Broadbeams"
    },
    {
        id: "forlindon",
        name: "Forlindon \u2014 Northern Lindon",
        category: 'silmarillion',
        era: "SA", year: 1, sortKey: 590.5,
        px: 1872, py: 1008,
        description: "Forlindon, or North Lindon, is the land north of the Gulf of Lune and west of the Blue Mountains. A surviving remnant of ancient Beleriand after the War of Wrath drowned most of that continent, it was part of Gil-galad\u2019s realm in the Second Age. By the Third Age the region was sparsely populated, its Elven inhabitants slowly departing for the Undying Lands.",
        characters: "Gil-galad, C\u00edrdan"
    },
    {
        id: "grey-havens",
        name: "The Grey Havens \u2014 Mithlond",
        category: 'silmarillion',
        era: "SA", year: 1, sortKey: 591,
        px: 2266, py: 1150,
        description: "Founded by C\u00edrdan the Shipwright after the War of Wrath destroyed Beleriand, the Grey Havens became the chief port from which the Elves departed Middle-earth for the Undying Lands. It was from here that Gandalf, Frodo, Bilbo, Galadriel, and Elrond sailed at the end of the Third Age.",
        characters: "C\u00edrdan, Gil-galad, Galadriel"
    },
    {
        id: "barad-dur-built",
        name: "Barad-d\u00fbr \u2014 The Dark Tower",
        category: 'silmarillion',
        era: "SA", year: 1000, sortKey: 1590,
        px: 5613, py: 2466,
        description: "Sauron began building his fortress in Mordor around SA 1000, using the power of the One Ring. The Dark Tower was besieged and thrown down by the Last Alliance, but because it was built with the Ring's power, it could not be fully destroyed while the Ring endured. Sauron rebuilt it when he returned to Mordor in the Third Age.",
        characters: "Sauron, the Nazg\u00fbl"
    },
    {
        id: "eregion-rings",
        name: "Eregion \u2014 The Rings of Power",
        category: 'silmarillion',
        era: "SA", year: 1500, sortKey: 2090,
        px: 3885, py: 1520,
        description: "In the land of Holly near the West-gate of Moria, Celebrimbor and the Gwaith-i-M\u00edrdain were deceived by Sauron in his fair guise of Annatar, 'Lord of Gifts.' Together they forged the Rings of Power. When Sauron forged the One Ring, the Elves perceived his treachery. Sauron destroyed Eregion and slew Celebrimbor.",
        characters: "Celebrimbor, Sauron (as Annatar), Elrond"
    },
    {
        id: "one-ring-forged",
        name: "Mount Doom \u2014 The Forging of the One Ring",
        category: 'silmarillion',
        era: "SA", year: 1600, sortKey: 2190,
        px: 5440, py: 2510,
        description: "In the fires of Orodruin, Sauron forged the One Ring to control all the other Rings of Power: 'One Ring to rule them all, One Ring to find them, One Ring to bring them all, and in the darkness bind them.' The moment he put it on, the Elven ring-bearers became aware of his purpose.",
        characters: "Sauron"
    },
    {
        id: "umbar-haven",
        name: "Umbar \u2014 Haven of the Corsairs",
        category: 'silmarillion',
        era: "SA", year: 2280, sortKey: 2870,
        px: 4204, py: 3995,
        description: "Umbar was a great natural harbour far to the south, first established as a fortress by the N\u00famen\u00f3reans in the Second Age. After the Downfall, the Black N\u00famen\u00f3reans held it as a base of power hostile to Gondor. It became the stronghold of the Corsairs, who raided Gondor's coasts for centuries. Their fleet sailed north during the War of the Ring, only to be captured by Aragorn at Pelargir.",
        characters: "The Corsairs, Castamir, Aragorn"
    },
    {
        id: "numenor-downfall",
        name: "Meneltarma \u2014 The Downfall of N\u00famenor",
        category: 'silmarillion',
        era: "SA", year: 3319, sortKey: 3909,
        px: 237, py: 3780,
        description: "Meneltarma, the Pillar of the Heavens, was the sacred mountain at the heart of N\u00famenor. When King Ar-Pharaz\u00f4n the Golden sailed with a great armada against Valinor, Eru Il\u00favatar broke and changed the world. N\u00famenor was swallowed by the sea, and the Undying Lands were removed from the circles of the world forever. Only the Faithful, led by Elendil and his sons, escaped to found the kingdoms of Arnor and Gondor.",
        characters: "Ar-Pharaz\u00f4n, Sauron, Elendil, Isildur, An\u00e1rion"
    },
    {
        id: "last-alliance",
        name: "Dagorlad \u2014 The Last Alliance",
        category: 'silmarillion',
        era: "SA", year: 3434, sortKey: 4024,
        px: 5100, py: 2220,
        description: "The Last Alliance of Elves and Men, led by Gil-galad and Elendil, fought the greatest battle of the Second Age on the plains before the Black Gate. After seven years besieging Barad-d\u00fbr, they overthrew Sauron, but both Gil-galad and Elendil fell. Isildur cut the One Ring from Sauron's hand.",
        characters: "Gil-galad, Elendil, Isildur, An\u00e1rion, Elrond, Sauron"
    },
    {
        id: "gladden-fields",
        name: "Gladden Fields \u2014 The Disaster of the Gladden Fields",
        category: 'silmarillion',
        era: "TA", year: 2, sortKey: 4033,
        px: 4400, py: 1360,
        description: "Two years after the defeat of Sauron, Isildur and his company were ambushed by Orcs while marching north along the Anduin. Isildur put on the One Ring to escape, but it slipped from his finger in the river and he was slain by Orc arrows. The Ring was lost for nearly 2,500 years.",
        characters: "Isildur, Ohtar"
    },
    {
        id: "dol-guldur-shadow",
        name: "Dol Guldur \u2014 The Shadow over Mirkwood",
        category: 'silmarillion',
        era: "TA", year: 1000, sortKey: 5031,
        px: 4672, py: 1578,
        description: "Around TA 1000, Sauron took secret refuge in southern Mirkwood, building the fortress of Dol Guldur and disguising himself as 'the Necromancer.' His shadow corrupted the Greenwood, turning it dark. From here he bred evil creatures and searched for the One Ring, until the White Council drove him out in TA 2941.",
        characters: "Sauron, Gandalf, Galadriel, Saruman"
    },

    // ── Appendices ──
    {
        id: "himling",
        name: "Himling \u2014 Remnant of Beleriand",
        category: 'appendix',
        era: "FA", year: 1, sortKey: 1.01,
        px: 1202, py: 752,
        description: "A small island in the northwestern sea, Himling is the surviving peak of the great hill of Himring. In the First Age, Maedhros son of F\u00ebanor fortified Himring as the anchor of his defensive line against Morgoth. When Beleriand was broken and drowned in the War of Wrath, the summit endured above the waves. By the Third Age it is a barren, uninhabited island \u2014 a silent monument to the wars and kingdoms long lost beneath the sea.",
        characters: "Maedhros, F\u00ebanor"
    },
    {
        id: "mountains-east",
        name: "Mountains of the East \u2014 The Orocarni",
        category: 'appendix',
        era: "FA", year: 1, sortKey: 1.02,
        px: 7252, py: 2538,
        description: "The Orocarni, or Red Mountains, formed the eastern boundary of Middle-earth in the earliest ages. In Tolkien's cosmology, four of the seven Dwarf clans \u2014 the Ironfists, Stiffbeards, Blacklocks, and Stonefoots \u2014 awoke at sites in or near these mountains. The Blue Wizards, Alatar and Pallando, were sent east and may have worked among the peoples of these distant lands to counter Sauron's influence.",
        characters: "Alatar, Pallando (Blue Wizards)"
    },
    {
        id: "northern-waste",
        name: "Northern Waste \u2014 Forodwaith",
        category: 'appendix',
        era: "FA", year: 1, sortKey: 1.03,
        px: 4212, py: 205,
        description: "The vast frozen wasteland of Forodwaith stretched across the entire far north of Middle-earth. In the First Age it lay in the shadow of Morgoth's fortress of Angband, and an unnatural cold lingered long after his defeat. Few dared enter these lands \u2014 only the Lossoth (Snowmen of Forochel) survived on its western fringes. Dragons bred in the Withered Heath on its southern border, and the remnants of Morgoth's Iron Mountains may have endured in the furthest north.",
        characters: "The Lossoth, Morgoth"
    },
    {
        id: "fanuidhol",
        name: "Fanuidhol \u2014 Cloudyhead",
        category: 'appendix',
        era: "FA", year: 1, sortKey: 1.04,
        px: 4023, py: 1430,
        description: "Fanuidhol, Cloudyhead (Bundushath\u00fbr in Khuzdul), is the easternmost of the three peaks above Moria, overlooking the Dimrill Dale and the Mirrormere from the south. Together with Caradhras to the north and Celebdil to the west, these three mountains form the crown above the ancient Dwarven kingdom of Khazad-d\u00fbm.",
        characters: ""
    },
    {
        id: "tol-fuin",
        name: "Tol Fuin \u2014 Remnant of Dorthonion",
        category: 'appendix',
        era: "FA", year: 460, sortKey: 460,
        px: 747, py: 874,
        description: "An island in the far northwestern sea, Tol Fuin is the surviving highland of Dorthonion (Taur-nu-Fuin). In the First Age, this forested plateau was held by Angrod and Aegnor against Morgoth until the Dagor Bragollach. Afterwards it became a haunted wilderness where Barahir and his outlaws hid, and where his son Beren wandered alone before escaping south to Doriath and his fateful meeting with L\u00fathien. When Beleriand was drowned, only this peak endured above the waves.",
        characters: "Barahir, Beren, Angrod, Aegnor"
    },
    {
        id: "tol-morwen",
        name: "Tol Morwen \u2014 The Gravestone Isle",
        category: 'appendix',
        era: "FA", year: 500, sortKey: 500,
        px: 334, py: 1094,
        description: "The smallest of the island remnants of Beleriand. In the First Age, T\u00farin Turambar and his mother Morwen were buried together beneath a great stone on the mound of the slain near the ruined halls of Nargothrond. When Beleriand was drowned in the War of Wrath, the gravestone alone stood above the waves \u2014 an island bearing the names of T\u00farin and Nienor, a last testament to the tragic children of H\u00farin.",
        characters: "T\u00farin Turambar, Morwen, Nienor, H\u00farin"
    },
    {
        id: "sea-rhun",
        name: "Sea of Rh\u00fbn \u2014 Waters of the East",
        category: 'appendix',
        era: "SA", year: 1, sortKey: 591.01,
        px: 6164, py: 1684,
        description: "A vast inland sea in the far east of Middle-earth, the Sea of Rh\u00fbn was the heartland of the Easterling peoples who repeatedly invaded Gondor throughout the ages. Little is known of the lands beyond it. The Blue Wizards, Alatar and Pallando, were sent east and are believed to have journeyed beyond the sea, but their fate remains unknown.",
        characters: "The Easterlings, Alatar, Pallando"
    },
    {
        id: "sea-nurnen",
        name: "Sea of N\u00farnen \u2014 The Slave Lands",
        category: 'appendix',
        era: "SA", year: 1000, sortKey: 1590.01,
        px: 5836, py: 2972,
        description: "An inland sea in southern Mordor, fed by rivers flowing down from the Ephel D\u00faath and Ash Mountains. The fertile lands of Nurn surrounding it were tended by vast armies of slaves who grew food to feed Sauron's war machine. After the fall of Barad-d\u00fbr, King Elessar freed the slaves and granted them the lands of Nurn as their own.",
        characters: "Aragorn (Elessar), the slaves of Nurn"
    },
    {
        id: "annuminas",
        name: "Ann\u00faminas \u2014 Capital of Arnor",
        category: 'appendix',
        era: "SA", year: 3320, sortKey: 3910,
        px: 2847, py: 885,
        description: "Built by Elendil on the shores of Lake Evendim after the Downfall of N\u00famenor, Ann\u00faminas served as the first capital of the North-kingdom of Arnor. As the D\u00fanedain dwindled, the city was abandoned and fell into ruin. After the War of the Ring, Aragorn restored it as his northern seat of power.",
        characters: "Elendil, Aragorn"
    },
    {
        id: "tower-hills",
        name: "Tower Hills \u2014 The Elostirion Stone",
        category: 'appendix',
        era: "SA", year: 3320, sortKey: 3910.01,
        px: 2386, py: 1159,
        description: "The Tower Hills (Emyn Beraid) stood between the Shire and the Grey Havens, crowned by the tall white tower of Elostirion. It housed one of the three Palant\u00edri given to the North-kingdom \u2014 but unlike the others, this stone looked only west, toward the Undying Lands across the sea. It was kept by the Elves of Lindon and taken aboard the last ship from the Grey Havens.",
        characters: "Elendil, Gil-galad"
    },
    {
        id: "white-mountains",
        name: "White Mountains \u2014 Ered Nimrais",
        category: 'appendix',
        era: "SA", year: 3320, sortKey: 3910.02,
        px: 4253, py: 2607,
        description: "The great mountain range running east to west between Rohan and Gondor. Beneath its peaks lie the Paths of the Dead, and along its northern feet stand Edoras, Dunharrow, and Helm's Deep. Its eastern end overlooks Minas Tirith and the Pelennor Fields. The beacons of Gondor are lit along its summits to call Rohan to war.",
        characters: "Th\u00e9oden, Aragorn"
    },
    {
        id: "brown-lands",
        name: "The Brown Lands \u2014 Gardens of the Entwives",
        category: 'appendix',
        era: "SA", year: 3429, sortKey: 4019,
        px: 4975, py: 1915,
        description: "Once a fertile region east of the Anduin tended by the Entwives, the Brown Lands were scorched and destroyed by Sauron during the War of the Last Alliance. The Entwives vanished and were never found \u2014 their loss is the source of Treebeard\u2019s great sorrow. By the Third Age the land was a barren, treeless waste. The Fellowship passed along its western edge while travelling down the Great River.",
        characters: "Treebeard, the Entwives"
    },
    {
        id: "emyn-nu-fuin",
        name: "Emyn-nu-Fuin \u2014 Mountains of Mirkwood",
        category: 'appendix',
        era: "TA", year: 1000, sortKey: 5031.01,
        px: 4996, py: 1235,
        description: "The Emyn-nu-Fuin, or 'Mountains under Night,' are a range of forested hills in southern Mirkwood. When Sauron established his stronghold at Dol Guldur, the shadow spread through the forest, transforming Greenwood the Great into Mirkwood. These mountains, shrouded in the darkness of the Necromancer's influence, became part of the perilous southern reaches that travellers avoided. The Old Forest Road once passed near here but fell into disuse as the forest grew ever more dangerous.",
        characters: "Sauron (as the Necromancer), Thranduil"
    },
    {
        id: "carn-dum",
        name: "Carn D\u00fbm \u2014 Fortress of Angmar",
        category: 'appendix',
        era: "TA", year: 1300, sortKey: 5331,
        px: 3374, py: 357,
        description: "The iron fortress of Carn D\u00fbm was the capital of Angmar, the realm the Witch-king founded around TA 1300 with the sole purpose of destroying the D\u00fanedain of the North. For nearly 700 years, Angmar waged war against the successor kingdoms of Arnor, eventually destroying all three.",
        characters: "The Witch-king"
    },
    {
        id: "argonath",
        name: "Argonath \u2014 The Pillars of the Kings",
        category: 'appendix',
        era: "TA", year: 1340, sortKey: 5371,
        px: 4511, py: 2105,
        description: "Two immense stone statues of Isildur and An\u00e1rion stand upon either side of the Anduin, their left hands raised in warning to enemies of Gondor. Built by R\u00f3mendacil II, the Argonath marked the northern border of Gondor. The Fellowship passed between them on their journey south from Lothl\u00f3rien.",
        characters: "Isildur, An\u00e1rion, R\u00f3mendacil II"
    },
    {
        id: "shire-homeland",
        name: "The Shire \u2014 Homeland of the Hobbits",
        category: 'appendix',
        era: "TA", year: 1601, sortKey: 5632,
        px: 2772, py: 1258,
        description: "A fertile, well-ordered region in Eriador settled by Hobbits in TA 1601 when the brothers Marcho and Blanco received a land-grant from King Argeleb II of Arthedain. Bounded by the Brandywine River to the east, the Far Downs to the west, and roughly the East Road to the south, the Shire was divided into four Farthings \u2014 North, South, East, and West. Its chief town was Michel Delving on the White Downs, seat of the Mayor. The Shire's pastoral peace was quietly maintained by the Rangers of the North \u2014 D\u00fanedain who guarded its borders without the Hobbits' knowledge. After the War of the Ring, King Elessar made the Shire a Free Land under the protection of the Northern Sceptre and forbade Men from entering it.",
        characters: "Bilbo, Frodo, Sam, Merry, Pippin, the Thain, the Mayor"
    },
    {
        id: "michel-delving",
        name: "Michel Delving \u2014 Chief Town of the Shire",
        category: 'appendix',
        era: "TA", year: 1601, sortKey: 5632.1,
        px: 2648, py: 1144,
        description: "Michel Delving on the White Downs was the chief town of the Shire and seat of the Mayor, the only real official in the land. It was the closest thing the hobbits had to a capital. The Mathom-house, the Shire's museum of curiosities, was located here \u2014 Bilbo donated the mithril coat he received from Thorin to its collection before later reclaiming it. The Lockholes, converted smials used as prisons by Sharkey's ruffians during the occupation, were also in Michel Delving.",
        characters: "Will Whitfoot (the Mayor), Lobelia Sackville-Baggins"
    },
    {
        id: "fornost-fall",
        name: "Fornost \u2014 Fall of the North-kingdom",
        category: 'appendix',
        era: "TA", year: 1974, sortKey: 6005,
        px: 3111, py: 866,
        description: "Fornost Erain, the Norbury of the Kings, became the capital of Arthedain after Ann\u00faminas was abandoned. In TA 1974 the Witch-king of Angmar overran the city and destroyed Arthedain. A year later, a combined force from Gondor, Lindon, and Rivendell defeated the Witch-king at the Battle of Fornost\u2014but too late to save the kingdom.",
        characters: "Arvedui, E\u00e4rnur, Gl\u00f3rfindel, the Witch-king"
    },
    {
        id: "forochel",
        name: "Forochel \u2014 The Last King of Arthedain",
        category: 'appendix',
        era: "TA", year: 1975, sortKey: 6006,
        px: 2572, py: 266,
        description: "After the fall of Fornost, King Arvedui fled north to the Ice Bay of Forochel, where the Lossoth (Snowmen) sheltered him. C\u00edrdan sent a ship to rescue him, but it was crushed in the ice and Arvedui drowned. With him were lost two of the seven Palant\u00edri, sinking beneath the frozen waters forever.",
        characters: "Arvedui, the Lossoth, C\u00edrdan"
    },
    {
        id: "gollum-origin",
        name: "River-folk \u2014 The Origin of Gollum",
        category: 'appendix',
        era: "TA", year: 2463, sortKey: 6494,
        px: 4434, py: 1380,
        description: "In the upper vales of the Anduin, near the Gladden River, lived a small community of Stoors \u2014 a hobbit-like river-folk. It was here that D\u00e9agol found the One Ring while fishing, and his cousin Sm\u00e9agol murdered him to possess it. Corrupted by the Ring over five centuries, Sm\u00e9agol became the wretched creature Gollum, eventually retreating to the roots of the Misty Mountains. The Ring's long journey from Isildur's loss at the Gladden Fields to Bilbo's finding it in Gollum's cave began in these quiet woods.",
        characters: "Sm\u00e9agol (Gollum), D\u00e9agol"
    },
    {
        id: "field-celebrant",
        name: "Field of Celebrant \u2014 Birth of Rohan",
        category: 'appendix',
        era: "TA", year: 2510, sortKey: 6541,
        px: 4310, py: 1723,
        description: "In TA 2510, a great host of Easterlings invaded Gondor and pushed its armies back to the Field of Celebrant. In Gondor's darkest hour, Eorl the Young rode south from the far north with his entire people, the \u00c9oth\u00e9od, and routed the invaders. In gratitude, Steward Cirion granted Eorl the province of Calenardhon, which became Rohan.",
        characters: "Eorl the Young, Cirion"
    },
    {
        id: "withered-heath",
        name: "Withered Heath \u2014 The Dragon Lands",
        category: 'appendix',
        era: "TA", year: 2770, sortKey: 6801,
        px: 5020, py: 488,
        description: "The Withered Heath lay between the arms of the Grey Mountains in the far north, and was the breeding ground of the great dragons. It was from here that Smaug descended upon Erebor in TA 2770, driving the Dwarves into exile. Other dragons from the Heath had previously attacked the Grey Mountains, slaying King D\u00e1in I.",
        characters: "Smaug, D\u00e1in I"
    },
    {
        id: "east-bight",
        name: "East Bight \u2014 The Cleared Land",
        category: 'appendix',
        era: "TA", year: 1000, sortKey: 5031.02,
        px: 4922, py: 1556,
        description: "A great indentation in the eastern edge of Mirkwood, the East Bight was formed by Northmen who felled the trees over many generations. This clearing pushed deep into the forest, creating open land for settlement and agriculture. The Men who dwelt here were kin to the Rohirrim and the Lake-men, part of the broader peoples of Rhovanion. Their proximity to Dol Guldur made these lands perilous as the shadow grew in southern Mirkwood.",
        characters: "The Northmen of Rhovanion"
    },
    {
        id: "iron-hills",
        name: "Iron Hills \u2014 Realm of D\u00e1in Ironfoot",
        category: 'appendix',
        era: "TA", year: 2941, sortKey: 6972,
        px: 6154, py: 794,
        description: "The Iron Hills were a Dwarven stronghold east of Erebor, ruled by D\u00e1in Ironfoot of Durin's line. When word reached him of Thorin's reclaiming of Erebor, D\u00e1in marched with 500 Dwarves and arrived just in time for the Battle of Five Armies. After Thorin's death, D\u00e1in became King under the Mountain.",
        characters: "D\u00e1in Ironfoot, N\u00e1in"
    },
    {
        id: "dorwinion",
        name: "Dorwinion \u2014 Land of Wines",
        category: 'appendix',
        era: "TA", year: 2941, sortKey: 6972.01,
        px: 5964, py: 1428,
        description: "A wine-producing region on the northwestern shores of the Sea of Rh\u00fbn, Dorwinion was famed for its heady vintages. Barrels of Dorwinion wine were shipped to Thranduil's Halls in Mirkwood \u2014 and it was these potent wines that made the Elven-king's guards fall asleep, allowing Bilbo to engineer the Dwarves' escape in barrels.",
        characters: "Bilbo, Thranduil's butler"
    },
    {
        id: "confluence-celduin",
        name: "Confluence of Celduin and Carnen",
        category: 'appendix',
        era: "TA", year: 2941, sortKey: 6972.02,
        px: 5706, py: 1422,
        description: "Here the River Carnen (Redwater), flowing from the Iron Hills, merges with the River Running (Celduin) from Erebor and the Long Lake. The combined waters then flow south into the Sea of Rh\u00fbn. The Carnen's name, meaning 'Redwater,' likely refers to iron-rich sediments carried from the Dwarven mines of the Iron Hills. This confluence lay in the broad lands of Rhovanion, far from the centres of power in the west.",
        characters: "D\u00e1in Ironfoot's folk"
    },
    {
        id: "sarn-ford",
        name: "Sarn Ford \u2014 The Breach of the Shire",
        category: 'appendix',
        era: "TA", year: 3018, sortKey: 7049.08,
        px: 3025, py: 1444,
        description: "The main southern ford across the Brandywine River, Sarn Ford was secretly guarded by Aragorn's Rangers to protect the Shire \u2014 a service the hobbits never knew about. In September TA 3018, the Nazg\u00fbl forced the crossing, scattering the D\u00fanedain and entering the Shire to hunt for 'Baggins.' This breach of the Shire's invisible defences set the entire chase in motion.",
        characters: "The Nazg\u00fbl, the Rangers of the North, Aragorn"
    },
    {
        id: "last-bridge",
        name: "Last Bridge \u2014 The Elf-stone",
        category: 'appendix',
        era: "TA", year: 3018, sortKey: 7049.1015,
        px: 3681, py: 1154,
        description: "The Last Bridge crossed the River Hoarwell (Mitheithel) on the Great East Road \u2014 the last bridge before Rivendell. After the attack on Weathertop, Aragorn led the wounded Frodo and the hobbits here, fearing a Nazg\u00fbl ambush. Instead he found a pale green beryl set upon the bridge \u2014 a sign from Glorfindel that the crossing was safe and the Black Riders had been driven off.",
        characters: "Aragorn, Frodo, Sam, Merry, Pippin, Glorfindel"
    },
    {
        id: "tharbad",
        name: "Tharbad \u2014 Crossing of the Greyflood",
        category: 'appendix',
        era: "TA", year: 3018, sortKey: 7049.07,
        px: 3372, py: 1578,
        description: "Once a thriving trade town at the crossing of the Greyflood on the North-South Road, Tharbad fell into ruin as both Arnor and Gondor declined. By the time of the War of the Ring, only crumbling walls remained. Boromir lost his horse fording the river here on his long journey from Minas Tirith to Rivendell, and had to continue on foot.",
        characters: "Boromir"
    },
    {
        id: "brandywine-bridge",
        name: "Brandywine Bridge \u2014 The Scouring of the Shire",
        category: 'appendix',
        era: "TA", year: 3019, sortKey: 7050.11,
        px: 2974, py: 1126,
        description: "The Bridge of Stonebows, built by the kings of Arnor on the Great East Road, was the only bridge across the Brandywine and the eastern gateway to the Shire. When Frodo and company returned from the War of the Ring, they found it barricaded with spiked gates and guarded by Shirriffs under Saruman's control \u2014 their first sign the Shire had been taken over. The hobbits broke through the gates and sparked the liberation of the Shire.",
        characters: "Frodo, Sam, Merry, Pippin, Saruman"
    },
    {
        id: "cair-andros",
        name: "Cair Andros \u2014 Island Fortress",
        category: 'appendix',
        era: "TA", year: 3019, sortKey: 7050.0385,
        px: 4750, py: 2515,
        description: "A fortified island in the Anduin north of Osgiliath, shaped like a great ship with its prow pointing upstream. Gondor garrisoned it to guard the northern approaches to Minas Tirith. During the War of the Ring, Sauron's forces captured the island, threatening to cut off any reinforcements from Rohan.",
        characters: "Faramir, the garrison of Gondor"
    },
    {
        id: "dol-amroth",
        name: "Dol Amroth \u2014 City of the Swan Knights",
        category: 'appendix',
        era: "TA", year: 3019, sortKey: 7050.041,
        px: 3702, py: 2892,
        description: "The coastal stronghold of Dol Amroth was the seat of the Princes of Belfalas, who claimed descent from the Elves. Prince Imrahil led the renowned Swan Knights to the defence of Minas Tirith, and his company was among the most valiant at the Battle of the Pelennor Fields. He ruled Gondor briefly after Denethor's death.",
        characters: "Imrahil, Galador"
    },
    {
        id: "gap-rohan",
        name: "Gap of Rohan",
        category: 'appendix',
        era: "TA", year: 3019, sortKey: 7050.0295,
        px: 3742, py: 2135,
        description: "The wide pass between the southern end of the Misty Mountains and the northern end of the White Mountains, the Gap of Rohan was the only major land route between Eriador and Gondor that avoided mountain crossings. Saruman's control of Isengard at its northern end made the Gap a contested corridor throughout the War of the Ring.",
        characters: "Saruman"
    },
    {
        id: "near-harad",
        name: "Near Harad \u2014 Realm of the Southrons",
        category: 'appendix',
        era: "TA", year: 3019, sortKey: 7050.037,
        px: 5229, py: 3697,
        description: "The northern lands of the Haradrim, or Southrons, who were long enemies of Gondor. They fought alongside Sauron in the War of the Ring, riding great M\u00fbmakil (Oliphaunts) into battle at the Pelennor Fields. In Ithilien, Sam witnesses a skirmish between Faramir's rangers and a Haradrim column and reflects on the humanity of a fallen Southron warrior.",
        characters: "The Haradrim, Faramir, Sam"
    },
    {
        id: "khand",
        name: "Khand \u2014 Land of the Variags",
        category: 'appendix',
        era: "TA", year: 3019, sortKey: 7050.038,
        px: 6771, py: 3513,
        description: "Khand is a little-known land southeast of Mordor, home to the Variags \u2014 a fierce warrior people under Sauron\u2019s dominion. The Variags marched to war alongside the Haradrim and Easterlings at the Battle of the Pelennor Fields. Tolkien reveals almost nothing else of their culture or history, leaving Khand one of the most mysterious regions on the map of Middle-earth.",
        characters: "The Variags"
    },
    {
        id: "fords-isen",
        name: "Fords of Isen \u2014 Death of Th\u00e9odred",
        category: 'appendix',
        era: "TA", year: 3019, sortKey: 7050.025,
        px: 3700, py: 2104,
        description: "The Fords of Isen were the main crossing of the River Isen and a key strategic point between Rohan and Isengard. Saruman's forces attacked the Fords twice. In the first battle, Th\u00e9odred, son of King Th\u00e9oden and heir to Rohan, was slain\u2014an event that plunged the kingdom into crisis and left it leaderless as war approached.",
        characters: "Th\u00e9odred, Grimbold, \u00c9omer"
    },
    {
        id: "osgiliath-ruin",
        name: "Osgiliath \u2014 The Ruined Capital",
        category: 'towers',
        era: "TA", year: 3019, sortKey: 7050.039,
        px: 4856, py: 2658,
        description: "The ancient capital of Gondor, once spanning both banks of the Anduin, now a shattered ruin contested by Gondor and Mordor. Boromir led the defence that held the western bank, and it was a dream of Osgiliath's fall that prompted his journey to Rivendell. During the War of the Ring, Faramir's forces fight a desperate rearguard action as Sauron's armies pour across the river toward Minas Tirith.",
        characters: "Boromir, Faramir"
    },

    // ── The Hobbit ──
    {
        id: "unexpected-party",
        name: "Bag End \u2014 An Unexpected Party",
        category: 'hobbit',
        era: "TA", year: 2941, sortKey: 6972.04,
        px: 2746, py: 1115,
        description: "Gandalf and thirteen Dwarves led by Thorin Oakenshield arrive uninvited at Bilbo Baggins' hobbit-hole, recruiting the bewildered hobbit as their burglar for a quest to reclaim the Lonely Mountain from the dragon Smaug.",
        characters: "Bilbo, Gandalf, Thorin, Balin, Dwalin, F\u00edli, K\u00edli, and company"
    },
    {
        id: "trollshaws",
        name: "The Trollshaws \u2014 Three Trolls",
        category: 'hobbit',
        era: "TA", year: 2941, sortKey: 6972.06,
        px: 3811, py: 937,
        description: "The company encounters three Stone-trolls\u2014Tom, Bert, and William\u2014who capture the Dwarves and plan to cook them. Gandalf tricks the trolls by mimicking their voices until dawn turns them to stone.",
        characters: "Bilbo, Gandalf, Thorin, the Trolls"
    },
    {
        id: "rivendell-moon-letters",
        name: "Rivendell \u2014 The Moon Letters",
        category: 'hobbit',
        era: "TA", year: 2941, sortKey: 6972.062,
        px: 3922, py: 1096,
        description: "Elrond hosts the company and reads the moon letters on Thr\u00f3r's map, revealing the secret entrance to Erebor: 'Stand by the grey stone when the thrush knocks, and the last light of Durin's Day will shine upon the keyhole.'",
        characters: "Bilbo, Gandalf, Thorin, Elrond"
    },
    {
        id: "goblin-town",
        name: "Goblin-town / High Pass",
        category: 'hobbit',
        era: "TA", year: 2941, sortKey: 6972.07,
        px: 4080, py: 1030,
        description: "The High Pass over the Misty Mountains conceals Goblin-town beneath it, a sprawling underground warren ruled by the Great Goblin. Thorin's company is captured here while sheltering from a thunder-battle, and Gandalf slays the Great Goblin to lead their escape through the tunnels.",
        characters: "Gandalf, Thorin, the Great Goblin"
    },
    {
        id: "riddles-in-dark",
        name: "Misty Mountains \u2014 Riddles in the Dark",
        category: 'hobbit',
        era: "TA", year: 2941, sortKey: 6972.071,
        px: 4094, py: 1049,
        description: "Captured by goblins in the High Pass, the company fights free, but Bilbo is separated and lost in the deep tunnels. There he discovers a golden ring and meets Gollum, defeating him in a game of riddles to find the way out.",
        characters: "Bilbo, Gollum, the Great Goblin"
    },
    {
        id: "carrock",
        name: "The Carrock \u2014 Rescue by Eagles",
        category: 'hobbit',
        era: "TA", year: 2941, sortKey: 6972.072,
        px: 4319, py: 976,
        description: "Pursued by Wargs and goblins, the company is trapped in trees and saved by the Great Eagles, who carry them to safety at the Carrock, a great rock in the river Anduin.",
        characters: "Bilbo, Gandalf, Thorin, the Great Eagles"
    },
    {
        id: "beorns-hall",
        name: "Beorn's Hall",
        category: 'hobbit',
        era: "TA", year: 2941, sortKey: 6972.073,
        px: 4444, py: 944,
        description: "The company takes refuge with Beorn, a great skin-changer who can take the form of a bear. He confirms the goblins' pursuit and lends them ponies and provisions for the journey through Mirkwood.",
        characters: "Bilbo, Gandalf, Thorin, Beorn"
    },
    {
        id: "mirkwood-spiders",
        name: "Mirkwood \u2014 Spiders and Shadows",
        category: 'hobbit',
        era: "TA", year: 2941, sortKey: 6972.08,
        px: 4637, py: 945,
        description: "Without Gandalf, the company enters the dark forest of Mirkwood. They are ensnared by giant spiders. Bilbo uses the Ring and his Elven blade (which he names Sting) to free the Dwarves in his first true act of heroism.",
        characters: "Bilbo, Thorin, the Dwarves"
    },
    {
        id: "dol-guldur-council",
        name: "Dol Guldur \u2014 The White Council Strikes",
        category: 'hobbit',
        era: "TA", year: 2941, sortKey: 6972.081,
        px: 4690, py: 1578,
        description: "While the Dwarves journey through Mirkwood, Gandalf departs to join the White Council in an assault on Dol Guldur. They drive out the Necromancer\u2014revealed to be Sauron himself\u2014from the fortress. This is why Gandalf is absent during the company's capture by spiders and Wood-elves.",
        characters: "Gandalf, Saruman, the White Council, Sauron"
    },
    {
        id: "thranduils-halls",
        name: "Thranduil's Halls \u2014 The Woodland Realm",
        category: 'hobbit',
        era: "TA", year: 2941, sortKey: 6972.09,
        px: 4815, py: 962,
        description: "The Wood-elves of King Thranduil capture the Dwarves and imprison them. Bilbo, invisible with the Ring, sneaks through the halls for weeks before devising an escape plan using empty barrels floated down the Forest River.",
        characters: "Bilbo, Thorin, Thranduil"
    },
    {
        id: "lake-town",
        name: "Lake-town \u2014 Welcome to Esgaroth",
        category: 'hobbit',
        era: "TA", year: 2941, sortKey: 6972.10,
        px: 5105, py: 1125,
        description: "The company arrives at the trade town of Esgaroth on the Long Lake. Thorin declares himself King under the Mountain, and the Men of the Lake welcome the Dwarves, hoping for the return of the old prosperity foretold in legend.",
        characters: "Bilbo, Thorin, Bard, the Master of Lake-town"
    },
    {
        id: "erebor-inside",
        name: "Erebor \u2014 Inside the Lonely Mountain",
        category: 'hobbit',
        era: "TA", year: 2941, sortKey: 6972.101,
        px: 5161, py: 941,
        description: "Bilbo creeps down the secret passage and confronts Smaug the Golden in his vast treasure hoard. The hobbit's clever riddling conversation reveals the dragon's one weak spot\u2014a bare patch on his left breast.",
        characters: "Bilbo, Smaug, Thorin"
    },
    {
        id: "death-of-smaug",
        name: "Long Lake \u2014 The Death of Smaug",
        category: 'hobbit',
        era: "TA", year: 2941, sortKey: 6972.11,
        px: 5140, py: 1125,
        description: "Enraged by Bilbo's theft, Smaug descends on Lake-town in a storm of fire, setting the town ablaze. As the dragon wheels for another pass, Bard the Bowman\u2014guided by the thrush's message about the bare patch in Smaug's jewelled armour\u2014looses the Black Arrow and strikes true. Smaug crashes down full upon the town, his last throes splintering it to sparks. The lake roars in over the ruins, swallowing the dragon forever.",
        characters: "Smaug, Bard the Bowman, Bilbo"
    },
    {
        id: "mount-gundabad",
        name: "Mount Gundabad \u2014 The Goblin Horde",
        category: 'hobbit',
        era: "TA", year: 2941, sortKey: 6972.111,
        px: 3842, py: 447,
        description: "An ancient Dwarven holy site where Durin first awoke, Mount Gundabad was long ago seized by Orcs. In the Battle of Five Armies, Bolg leads a vast goblin army from Gundabad to Erebor, turning what had been a standoff between Dwarves, Elves, and Men into a desperate battle for survival.",
        characters: "Bolg, Thorin, D\u00e1in Ironfoot"
    },
    {
        id: "five-armies",
        name: "Dale \u2014 The Battle of Five Armies",
        category: 'hobbit',
        era: "TA", year: 2941, sortKey: 6972.112,
        px: 5123, py: 983,
        description: "After Bard slays Smaug, five armies converge on the Lonely Mountain: Men, Elves, Dwarves, Goblins, and Wargs. The Free Peoples unite against the goblin horde. Thorin is mortally wounded but reconciles with Bilbo before dying.",
        characters: "Thorin, Bilbo, Bard, Thranduil, D\u00e1in, Beorn, the Great Eagles"
    },

    // ── The Fellowship of the Ring ──
    {
        id: "bilbo-farewell",
        name: "Bag End \u2014 Bilbo's Farewell",
        category: 'fellowship',
        era: "TA", year: 3001, sortKey: 7032.09,
        px: 2764, py: 1115,
        description: "Bilbo Baggins celebrates his 111th birthday with a magnificent party, then vanishes using the One Ring. He leaves the Ring to his nephew Frodo, setting the quest in motion.",
        characters: "Bilbo, Frodo, Gandalf"
    },
    {
        id: "bucklebury-ferry",
        name: "Bucklebury Ferry \u2014 Escape from the Black Rider",
        category: 'fellowship',
        era: "TA", year: 3018, sortKey: 7049.0923,
        px: 2988, py: 1178,
        description: "The ferry across the Brandywine south of the Bridge, connecting the Shire to Buckland. Frodo, Sam, and Pippin race to the ferry with a Black Rider closing behind them. They push off just in time, watching the dark shape halt at the water's edge before turning away toward the Bridge.",
        characters: "Frodo, Sam, Merry, Pippin, the Nazg\u00fbl"
    },
    {
        id: "crickhollow",
        name: "Crickhollow \u2014 The Conspiracy Unmasked",
        category: 'fellowship',
        era: "TA", year: 3018, sortKey: 7049.0924,
        px: 3034, py: 1204,
        description: "Frodo's house in Buckland, purchased as a cover story for leaving the Shire. Here Merry, Pippin, Sam, and Fatty Bolger reveal they have known about the Ring all along and insist on joining Frodo's journey. After the company departs into the Old Forest, a Nazg\u00fbl attacks the house at night. Fatty Bolger escapes and sounds the Horn-call of Buckland, the first time it had been blown in generations.",
        characters: "Frodo, Sam, Merry, Pippin, Fatty Bolger, the Nazg\u00fbl"
    },
    {
        id: "old-forest",
        name: "Old Forest \u2014 Tom Bombadil",
        category: 'fellowship',
        era: "TA", year: 3018, sortKey: 7049.0926,
        px: 3098, py: 1178,
        description: "Leaving the Shire through the High Hay, the hobbits enter the ancient Old Forest where Old Man Willow traps Merry and Pippin. They are rescued by Tom Bombadil, the enigmatic master of the forest, who is unaffected by the One Ring's power \u2014 one of the great mysteries of Middle-earth.",
        characters: "Frodo, Sam, Merry, Pippin, Tom Bombadil, Goldberry"
    },
    {
        id: "barrow-downs",
        name: "Barrow-downs \u2014 Blades of Westernesse",
        category: 'fellowship',
        era: "TA", year: 3018, sortKey: 7049.0928,
        px: 3185, py: 1144,
        description: "Crossing the ancient burial mounds, the hobbits are ensnared by a Barrow-wight. Tom Bombadil rescues them again. In the wight's hoard, they find D\u00fanedain swords forged to fight Angmar \u2014 it is Merry's blade that later helps slay the Witch-king at the Pelennor Fields.",
        characters: "Frodo, Sam, Merry, Pippin, Tom Bombadil, the Barrow-wight"
    },
    {
        id: "bree",
        name: "Bree \u2014 The Prancing Pony",
        category: 'fellowship',
        era: "TA", year: 3018, sortKey: 7049.0929,
        px: 3254, py: 1139,
        description: "Frodo and the hobbits meet the mysterious ranger Strider (Aragorn) at the Prancing Pony inn. Frodo accidentally puts on the Ring, drawing the attention of the Nazg\u00fbl.",
        characters: "Frodo, Sam, Merry, Pippin, Aragorn"
    },
    {
        id: "midgewater",
        name: "Midgewater Marshes",
        category: 'fellowship',
        era: "TA", year: 3018, sortKey: 7049.10,
        px: 3367, py: 1084,
        description: "After leaving Bree, Aragorn leads the hobbits off the Road to avoid the Nazg\u00fbl, and they spend several miserable days crossing the Midgewater Marshes \u2014 a trackless bog east of Bree infested with clouds of biting midges. It is unglamorous but necessary, and the hobbits begin to understand the hardship of life in the wild.",
        characters: "Frodo, Sam, Merry, Pippin, Aragorn"
    },
    {
        id: "weathertop",
        name: "Weathertop \u2014 Attack of the Nazg\u00fbl",
        category: 'fellowship',
        era: "TA", year: 3018, sortKey: 7049.1006,
        px: 3484, py: 1097,
        description: "The Witch-king of Angmar stabs Frodo with a Morgul blade atop the ancient watchtower of Amon S\u00fbl. The wound nearly claims Frodo's life, leaving a lasting mark.",
        characters: "Frodo, Aragorn, the Nazg\u00fbl"
    },
    {
        id: "ford-bruinen",
        name: "Ford of Bruinen \u2014 Flight to the Ford",
        category: 'fellowship',
        era: "TA", year: 3018, sortKey: 7049.1020,
        px: 3850, py: 1134,
        description: "With a Morgul wound slowly claiming his life, Frodo races on Glorfindel's horse Asfaloth toward the Ford of Bruinen, the last crossing before Rivendell. The Nine Nazg\u00fbl pursue him to the river's edge. As they enter the water, Elrond unleashes the river in a great flood shaped as white horses, sweeping the Black Riders away and breaking their pursuit at last.",
        characters: "Frodo, Glorfindel, Aragorn, the Nazg\u00fbl, Elrond, Gandalf"
    },
    {
        id: "council-elrond",
        name: "Rivendell \u2014 The Council of Elrond",
        category: 'fellowship',
        era: "TA", year: 3018, sortKey: 7049.1025,
        px: 3940, py: 1096,
        description: "Representatives of the Free Peoples gather at the Last Homely House. The Fellowship of the Ring is formed: nine companions to counter the nine Nazg\u00fbl, tasked with destroying the One Ring.",
        characters: "Frodo, Gandalf, Aragorn, Legolas, Gimli, Boromir, Sam, Merry, Pippin"
    },
    {
        id: "caradhras",
        name: "Caradhras \u2014 The Redhorn Pass",
        category: 'fellowship',
        era: "TA", year: 3019, sortKey: 7050.0112,
        px: 3973, py: 1447,
        description: "Caradhras, the Redhorn (Barazinbar in Khuzdul), is the northernmost and tallest of the three peaks above Moria. The Fellowship attempts to cross the Redhorn Pass over its shoulder but is driven back by blizzard and malice \u2014 whether from the cruel mountain itself or from Sauron. Their failure on the pass forces the fateful decision to go under the mountains through Moria.",
        characters: "Gandalf, Aragorn, the Fellowship"
    },
    {
        id: "doors-durin",
        name: "Doors of Durin \u2014 Speak Friend and Enter",
        category: 'fellowship',
        era: "TA", year: 3019, sortKey: 7050.0113,
        px: 3940, py: 1490,
        description: "At the West-gate of Moria, the Fellowship finds the ancient Doors of Durin sealed shut. An inscription reads 'Speak, friend, and enter.' Gandalf tries spell after spell before realising it is a simple riddle \u2014 the Elvish word for friend, mellon, opens the doors. As they enter, the Watcher in the Water attacks from the dark lake, seizing Frodo. The others rescue him, but the creature pulls the doors shut and collapses the entrance, trapping the Fellowship inside.",
        characters: "Gandalf, Frodo, the Watcher in the Water, the Fellowship"
    },
    {
        id: "bridge-khazad-dum",
        name: "Moria \u2014 The Bridge of Khazad-d\u00fbm",
        category: 'fellowship',
        era: "TA", year: 3019, sortKey: 7050.0115,
        px: 3981, py: 1515,
        description: "The Fellowship passes through the abandoned Dwarven kingdom. After discovering the fate of Balin's colony, they are attacked by Orcs and a cave troll. Gandalf confronts the Balrog on the Bridge and falls into shadow.",
        characters: "Gandalf, the Balrog, the Fellowship"
    },
    {
        id: "dimrill-dale",
        name: "Dimrill Dale \u2014 The Mirrormere",
        category: 'fellowship',
        era: "TA", year: 3019, sortKey: 7050.0115,
        px: 4058, py: 1555,
        description: "Emerging grief-stricken from Moria after Gandalf's fall, the Fellowship pauses at the Dimrill Dale. Gimli looks into the Mirrormere (Kheled-z\u00e2ram), the sacred lake where Durin the Deathless first saw a crown of stars reflected about his head, and the sight strengthens his resolve.",
        characters: "Aragorn, Legolas, Gimli, Frodo, Sam, Merry, Pippin, Boromir"
    },
    {
        id: "lothlorien",
        name: "Lothl\u00f3rien \u2014 The Golden Wood",
        category: 'fellowship',
        era: "TA", year: 3019, sortKey: 7050.0117,
        px: 4214, py: 1609,
        description: "The grieving Fellowship takes refuge in the Elven realm of Lady Galadriel. She shows Frodo the Mirror of Galadriel and resists the temptation of the Ring. The company receives Elven gifts and boats.",
        characters: "Galadriel, Celeborn, the Fellowship"
    },
    {
        id: "caras-galadhon",
        name: "Caras Galadhon \u2014 The Heart of Lothl\u00f3rien",
        category: 'fellowship',
        era: "TA", year: 3019, sortKey: 7050.02,
        px: 4190, py: 1640,
        description: "The city of the Galadhrim, built on a great hill among the mallorn trees. Here stand the high telain of Celeborn and Galadriel, and the Mirror of Galadriel in its garden hollow. From this city the Fellowship receives the Elven cloaks, lembas, and other gifts \u2014 including the Phial of Galadriel and the three golden hairs she gives to Gimli.",
        characters: "Galadriel, Celeborn, Frodo, Gimli, the Fellowship"
    },
    {
        id: "amon-hen",
        name: "Amon Hen \u2014 The Breaking of the Fellowship",
        category: 'fellowship',
        era: "TA", year: 3019, sortKey: 7050.0226,
        px: 4480, py: 2174,
        description: "Boromir succumbs to the Ring's temptation and tries to take it from Frodo. Orcs attack; Boromir redeems himself defending Merry and Pippin but is slain. Frodo and Sam depart alone for Mordor.",
        characters: "Boromir, Frodo, Aragorn, Merry, Pippin"
    },
    {
        id: "rauros-falls",
        name: "Rauros Falls \u2014 Boromir's Funeral",
        category: 'fellowship',
        era: "TA", year: 3019, sortKey: 7050.0226,
        px: 4502, py: 2196,
        description: "The great waterfall of Rauros on the Anduin, near the hills of Emyn Muil. After Boromir falls defending Merry and Pippin, Aragorn, Legolas, and Gimli place his body in an Elven boat and send it over the falls as a funeral rite \u2014 a solemn farewell to the son of Gondor.",
        characters: "Aragorn, Legolas, Gimli, Boromir"
    },

    // ── The Two Towers ──
    {
        id: "celebdil",
        name: "Celebdil \u2014 Durin\u2019s Tower",
        category: 'towers',
        era: "TA", year: 3019, sortKey: 7050.0125,
        px: 3917, py: 1457,
        description: "Celebdil, the Silvertine (Zirakzigil in Khuzdul), is the westernmost of the three peaks above Moria. At its summit stands Durin\u2019s Tower, carved in the living rock and reached by the Endless Stair spiralling up from the deepest foundations of Khazad-d\u00fbm. After falling from the Bridge, Gandalf pursues the Balrog up the Endless Stair to this peak. For two days they battle on the mountainside until Gandalf throws down the Balrog, shattering the tower and the mountainside where he fell. Gandalf himself passes away on the peak before being sent back as the White.",
        characters: "Gandalf, Durin\u2019s Bane (the Balrog)"
    },
    {
        id: "eaves-fangorn",
        name: "Eaves of Fangorn \u2014 Escape from the Uruk-hai",
        category: 'towers',
        era: "TA", year: 3019, sortKey: 7050.0229,
        px: 4017, py: 2086,
        description: "At the edge of Fangorn Forest, the Riders of Rohan under \u00c9omer surround and destroy the Uruk-hai band carrying Merry and Pippin. In the chaos of the night battle, the two hobbits slip their bonds and crawl into the eaves of the forest, where they will encounter Treebeard. Aragorn, Legolas, and Gimli arrive the next morning to find the smouldering orc pyre and track the hobbits' trail into the trees.",
        characters: "\u00c9omer, Merry, Pippin, Ugl\u00fak, Grish\u00e1kh, Aragorn, Legolas, Gimli"
    },
    {
        id: "fangorn-treebeard",
        name: "Fangorn Forest \u2014 The Meeting with Treebeard",
        category: 'towers',
        era: "TA", year: 3019, sortKey: 7050.0299,
        px: 4043, py: 1918,
        description: "After escaping the Uruk-hai during the battle at the forest\u2019s edge, Merry and Pippin flee into the depths of Fangorn. There they encounter Treebeard, the oldest of the Ents and shepherd of the trees. He carries them to his home at Wellinghall, and their tales of Saruman\u2019s treachery against the forest rouse the Ents to march on Isengard.",
        characters: "Treebeard, Merry, Pippin"
    },
    {
        id: "fangorn-white-wizard",
        name: "Fangorn Forest \u2014 The White Wizard",
        category: 'towers',
        era: "TA", year: 3019, sortKey: 7050.0301,
        px: 4004, py: 2000,
        description: "Tracking Merry and Pippin into Fangorn, Aragorn, Legolas, and Gimli encounter a figure in white they mistake for Saruman. It is Gandalf, returned from death after his battle with the Balrog in the depths of Moria. Reborn as Gandalf the White, he tells them the hobbits are safe and leads them to Edoras to free King Th\u00e9oden from Saruman\u2019s influence.",
        characters: "Gandalf, Aragorn, Legolas, Gimli"
    },
    {
        id: "emyn-muil",
        name: "Emyn Muil \u2014 The Taming of Gollum",
        category: 'towers',
        era: "TA", year: 3019, sortKey: 7050.0301,
        px: 4623, py: 2147,
        description: "Frodo and Sam become lost in the rocky maze of Emyn Muil. They capture Gollum, who has been stalking them, and Frodo makes him swear on the Precious to serve as their guide to Mordor.",
        characters: "Frodo, Sam, Gollum"
    },
    {
        id: "edoras",
        name: "Edoras \u2014 The Golden Hall of Meduseld",
        category: 'towers',
        era: "TA", year: 3019, sortKey: 7050.0302,
        px: 3969, py: 2344,
        description: "Gandalf frees King Th\u00e9oden from the influence of Saruman, channeled through Gr\u00edma Wormtongue. The people of Rohan prepare for war against Isengard's forces.",
        characters: "Gandalf, Th\u00e9oden, \u00c9owyn, \u00c9omer, Gr\u00edma"
    },
    {
        id: "helms-deep",
        name: "Helm's Deep \u2014 The Battle of the Hornburg",
        category: 'towers',
        era: "TA", year: 3019, sortKey: 7050.0303,
        px: 3760, py: 2277,
        description: "The Rohirrim make a desperate stand against Saruman's army of 10,000 Uruk-hai at the fortress of Helm's Deep. Victory comes at dawn with the charge of Gandalf and the Rohirrim, and the arrival of the Huorns.",
        characters: "Th\u00e9oden, Aragorn, Legolas, Gimli, Gandalf, Erkenbrand"
    },
    {
        id: "dead-marshes",
        name: "The Dead Marshes",
        category: 'towers',
        era: "TA", year: 3019, sortKey: 7050.0304,
        px: 4894, py: 2150,
        description: "Gollum leads the hobbits through the treacherous Dead Marshes, where ghostly lights and the faces of the ancient dead lie beneath the water. A Nazg\u00fbl on a fell beast passes overhead.",
        characters: "Frodo, Sam, Gollum"
    },
    {
        id: "isen-dam",
        name: "Dam on the River Isen",
        category: 'towers',
        era: "TA", year: 3019, sortKey: 7050.0303,
        px: 3793, py: 1978,
        description: "The Ents broke the great dam on the River Isen during their assault on Isengard, unleashing the waters into the Ring of Isengard and flooding Saruman\u2019s underground armouries, furnaces, and war machinery. The deluge drowned his forces and rendered the fortress useless, trapping the wizard in the tower of Orthanc.",
        characters: "Treebeard, the Ents"
    },
    {
        id: "isengard-ents",
        name: "Isengard \u2014 The Ents' Assault",
        category: 'towers',
        era: "TA", year: 3019, sortKey: 7050.0304,
        px: 3775, py: 2039,
        description: "Roused to fury by Saruman's destruction of the forest, the Ents march on Isengard and break the dam, flooding the fortress and trapping Saruman in the tower of Orthanc.",
        characters: "Treebeard, Merry, Pippin, Saruman"
    },
    {
        id: "orthanc-saruman",
        name: "Orthanc \u2014 The Voice of Saruman",
        category: 'towers',
        era: "TA", year: 3019, sortKey: 7050.0305,
        px: 3744, py: 2017,
        description: "After the flooding of Isengard, Gandalf and the company confront Saruman atop the tower of Orthanc. Saruman attempts to sway them with his persuasive voice but is broken by Gandalf, who casts him from the order. Gr\u00edma Wormtongue hurls the palant\u00edr of Orthanc from the tower. That night Pippin steals a look into the seeing-stone and is seen by Sauron \u2014 forcing Gandalf to ride at once to Minas Tirith with Pippin.",
        characters: "Gandalf, Saruman, Gr\u00edma, Pippin, Aragorn, Th\u00e9oden"
    },
    {
        id: "henneth-annun",
        name: "Henneth Ann\u00fbn \u2014 Window of the Sunset",
        category: 'towers',
        era: "TA", year: 3019, sortKey: 7050.0307,
        px: 5029, py: 2491,
        description: "A hidden refuge of the Rangers of Ithilien behind a curtain waterfall. Faramir brings Frodo and Sam here after capturing them in the wilds of Ithilien. Behind the falls, Faramir questions Frodo about the Ring and learns of Boromir's death \u2014 and unlike his brother, chooses not to seize the Ring.",
        characters: "Faramir, Frodo, Sam, Gollum"
    },
    {
        id: "cross-roads",
        name: "The Cross-roads \u2014 The Fallen King",
        category: 'towers',
        era: "TA", year: 3019, sortKey: 7050.0309,
        px: 4927, py: 2678,
        description: "At the junction where the road from Osgiliath meets the southward road to Minas Morgul, Frodo finds the old statue of a seated king. Its head has been struck off and replaced with a crude stone carved with a leering face, but the severed head lies nearby in the grass, crowned by trailing plants with white and gold flowers. A fleeting beam of sunlight illuminates the crowned head \u2014 a quiet sign that Sauron cannot conquer all.",
        characters: "Frodo, Sam, Gollum"
    },

    // ── The Return of the King ──
    {
        id: "dunharrow",
        name: "Dunharrow \u2014 Muster of Rohan",
        category: 'king',
        era: "TA", year: 3019, sortKey: 7050.0309,
        px: 4005, py: 2440,
        description: "A mountain refuge on a sheer cliff above Harrowdale, reached by a switchback path lined with ancient P\u00fakel-men statues. The Rohirrim muster here before riding to Gondor's aid. Behind the Firienfeld lies the Dark Door \u2014 entrance to the Paths of the Dead, which Aragorn alone dares to enter.",
        characters: "Th\u00e9oden, \u00c9owyn, Merry, Aragorn"
    },
    {
        id: "minas-morgul",
        name: "Minas Morgul \u2014 The Dead City",
        category: 'king',
        era: "TA", year: 3019, sortKey: 7050.0310,
        px: 5033, py: 2660,
        description: "The hobbits pass the dread city of Minas Morgul, once Minas Ithil, now home to the Witch-king and his Nazg\u00fbl. As they climb the stairs beside it, the army of Morgul issues forth, led by the Witch-king, marching to war against Gondor.",
        characters: "Frodo, Sam, Gollum, the Witch-king"
    },
    {
        id: "paths-dead",
        name: "Paths of the Dead \u2014 The Haunted Way",
        category: 'king',
        era: "TA", year: 3019, sortKey: 7050.0308,
        px: 3945, py: 2458,
        description: "A dread passage beneath the White Mountains connecting Dunharrow to the vale beyond. The Dead Men who broke their oath to Isildur haunt its darkness. None had dared enter for centuries until Aragorn, as Isildur's heir, rode through with Legolas, Gimli, and the Grey Company, commanding the Dead to follow and fulfil their ancient pledge.",
        characters: "Aragorn, Legolas, Gimli, the Grey Company, the Dead Men"
    },
    {
        id: "erech",
        name: "Erech \u2014 The Paths of the Dead",
        category: 'king',
        era: "TA", year: 3019, sortKey: 7050.0308,
        px: 3886, py: 2470,
        description: "Aragorn, Legolas, and Gimli ride the Paths of the Dead beneath the White Mountains and emerge at the Stone of Erech. There Aragorn, as heir of Isildur, summons the oathbreaking Dead Men of Dunharrow to fulfil their ancient pledge. The ghostly army follows him south to Pelargir, where they overwhelm the Corsairs of Umbar in terror. Their oath fulfilled, the Dead are released and depart forever.",
        characters: "Aragorn, Legolas, Gimli, the Dead Men of Dunharrow"
    },
    {
        id: "cirith-ungol-shelob",
        name: "Cirith Ungol \u2014 Shelob's Lair",
        category: 'king',
        era: "TA", year: 3019, sortKey: 7050.0312,
        px: 5082, py: 2526,
        description: "Gollum's treachery is revealed as he leads the hobbits into the lair of the giant spider Shelob. Frodo is stung and paralyzed. Sam drives Shelob away with the Phial of Galadriel and Sting, then rescues Frodo from the tower of Cirith Ungol.",
        characters: "Frodo, Sam, Gollum, Shelob"
    },
    {
        id: "tower-cirith-ungol",
        name: "Tower of Cirith Ungol \u2014 Sam's Rescue",
        category: 'king',
        era: "TA", year: 3019, sortKey: 7050.0314,
        px: 5120, py: 2530,
        description: "After Shelob stings Frodo, the orcs of the tower carry his body inside. Sam, believing Frodo dead, takes the Ring \u2014 but overhears the orcs and realises Frodo is alive. He storms the tower alone, finding the garrison has slaughtered itself in a quarrel over Frodo's mithril coat. Sam returns the Ring and the two hobbits escape disguised as orcs into Mordor.",
        characters: "Sam, Frodo, Shagrat, Gorbag"
    },
    {
        id: "pelargir",
        name: "Pelargir \u2014 Capture of the Corsair Fleet",
        category: 'king',
        era: "TA", year: 3019, sortKey: 7050.0313,
        px: 4509, py: 2977,
        description: "Aragorn leads the Dead south from Erech to the ancient port of Pelargir, where the Corsairs of Umbar have anchored their fleet. The Dead sweep through the Corsairs in terror, and Aragorn seizes the ships. He releases the Dead Men from their oath, and they vanish at last. Aragorn then mans the ships with Rangers, men of Lebennin and Lamedon, and sails up the Anduin to the Pelennor Fields.",
        characters: "Aragorn, Legolas, Gimli, the Dead Men of Dunharrow, the Corsairs of Umbar"
    },
    {
        id: "lamedon",
        name: "Lamedon \u2014 Angbor's Rally",
        category: 'king',
        era: "TA", year: 3019, sortKey: 7050.0313,
        px: 4125, py: 2795,
        description: "A valley fiefdom of Gondor on the southern slopes of the White Mountains, along the River Ciril. After Aragorn emerged from the Paths of the Dead and routed the Corsairs at Pelargir, Lord Angbor of Lamedon rallied his men and joined Aragorn's force sailing up the Anduin to relieve Minas Tirith at the Battle of the Pelennor Fields.",
        characters: "Angbor, Aragorn"
    },
    {
        id: "druadan-forest",
        name: "Dr\u00faadan Forest \u2014 The Wild Men",
        category: 'king',
        era: "TA", year: 3019, sortKey: 7050.0314,
        px: 4618, py: 2531,
        description: "When the road to Minas Tirith is blocked by Sauron's forces, Gh\u00e2n-buri-Gh\u00e2n of the Dr\u00faedain (Wild Men) guides the Rohirrim through secret paths in the ancient forest, allowing them to reach the Pelennor Fields in time. In gratitude, Aragorn later grants the Dr\u00faadan Forest to the Wild Men forever.",
        characters: "Gh\u00e2n-buri-Gh\u00e2n, Th\u00e9oden, \u00c9omer, Merry"
    },
    {
        id: "minas-tirith-siege",
        name: "Minas Tirith \u2014 The Siege of Gondor",
        category: 'king',
        era: "TA", year: 3019, sortKey: 7050.0314,
        px: 4720, py: 2641,
        description: "Sauron's forces besiege the White City. The Witch-king breaks the Great Gate. Denethor, driven mad by the palant\u00edr, attempts to burn Faramir alive. The Rohirrim arrive at dawn to turn the tide.",
        characters: "Gandalf, Denethor, Faramir, Pippin"
    },
    {
        id: "pelennor-fields",
        name: "Pelennor Fields \u2014 The Great Battle",
        category: 'king',
        era: "TA", year: 3019, sortKey: 7050.0315,
        px: 4784, py: 2638,
        description: "The greatest battle of the War of the Ring. Th\u00e9oden leads the Rohirrim charge and falls beneath his horse. \u00c9owyn and Merry slay the Witch-king. Aragorn arrives on captured Corsair ships with reinforcements from southern Gondor to turn the tide.",
        characters: "Th\u00e9oden, \u00c9owyn, Merry, Aragorn, the Witch-king"
    },
    {
        id: "black-gate",
        name: "The Black Gate \u2014 The Last Debate",
        category: 'king',
        era: "TA", year: 3019, sortKey: 7050.0325,
        px: 5141, py: 2272,
        description: "Aragorn leads the armies of the West to the Black Gate of Mordor in a desperate gambit to draw Sauron's Eye away from Frodo. Vastly outnumbered, they fight to buy time for the Ring-bearer.",
        characters: "Aragorn, Gandalf, Legolas, Gimli, Merry, Pippin"
    },
    {
        id: "mount-doom-end",
        name: "Mount Doom \u2014 The End of All Things",
        category: 'king',
        era: "TA", year: 3019, sortKey: 7050.0325,
        px: 5419, py: 2532,
        description: "Frodo and Sam reach the Crack of Doom after an agonizing journey across Mordor. At the last moment, Frodo claims the Ring\u2014but Gollum bites it from his finger and falls into the fire, destroying the One Ring and Sauron forever.",
        characters: "Frodo, Sam, Gollum"
    },
    {
        id: "field-cormallen",
        name: "Field of Cormallen \u2014 The Eagles Are Coming",
        category: 'king',
        era: "TA", year: 3019, sortKey: 7050.04,
        px: 4799, py: 2565,
        description: "After the destruction of the Ring, Gandalf rides the great Eagle Gwaihir to rescue Frodo and Sam from the slopes of Mount Doom. They awake in Ithilien to find Gandalf at their bedside. The Host of the West honours the hobbits before the gates of the field, and Aragorn bows to them, saying 'Praise them with great praise!'",
        characters: "Frodo, Sam, Gandalf, Aragorn, Gwaihir"
    },
    {
        id: "coronation",
        name: "Minas Tirith \u2014 The Coronation of Elessar",
        category: 'king',
        era: "TA", year: 3019, sortKey: 7050.05,
        px: 4730, py: 2650,
        description: "Aragorn is crowned King Elessar on the plain before Minas Tirith. Gandalf sets the White Crown upon his head, and Aragorn speaks the words of Elendil: 'Et E\u00e4rello Endorenna ut\u00falien.' At the city gate Arwen awaits him, and they are wed at last \u2014 the union of the lines of Elros and Elrond, long sundered.",
        characters: "Aragorn, Arwen, Gandalf, Frodo, Faramir"
    },
    {
        id: "mindolluin",
        name: "Mindolluin \u2014 The White Tree",
        category: 'king',
        era: "TA", year: 3019, sortKey: 7050.06,
        px: 4740, py: 2665,
        description: "Gandalf leads Aragorn up the slopes of Mount Mindolluin above Minas Tirith. In a high hallow of snow they find a sapling of the White Tree, descended from Nimloth of N\u00famenor and ultimately from Telperion, the eldest of Trees. Aragorn plants it in the Court of the Fountain, where it flowers \u2014 a sign that his kingdom will endure.",
        characters: "Aragorn, Gandalf"
    },
    {
        id: "bywater-scouring",
        name: "Bywater \u2014 The Scouring of the Shire",
        category: 'king',
        era: "TA", year: 3019, sortKey: 7050.11,
        px: 2848, py: 1147,
        description: "Returning home, the four hobbits find the Shire under the tyranny of 'Sharkey' \u2014 Saruman, diminished but vengeful. Merry and Pippin rouse the Shire-folk, and at the Battle of Bywater the ruffians are overthrown. Frodo confronts Saruman at Bag End and offers mercy, but Gr\u00edma Wormtongue turns on his master and slays him. It is the last killing in the War of the Ring.",
        characters: "Frodo, Sam, Merry, Pippin, Saruman, Gr\u00edma"
    },
    {
        id: "westmarch",
        name: "Westmarch \u2014 The Red Book",
        category: 'king',
        era: "TA", year: 3021, sortKey: 7052.09,
        px: 2524, py: 1019,
        description: "After the War of the Ring, King Elessar granted the hobbits the land between the Far Downs and the Tower Hills, extending the Shire westward. This region became the Westmarch. Sam's eldest daughter Elanor and her husband Fastred of Greenholm settled here as Wardens of Westmarch. The Red Book of Westmarch \u2014 the in-universe manuscript from which The Lord of the Rings is said to be copied \u2014 was kept by their descendants in this land.",
        characters: "Elanor, Fastred, Samwise Gamgee"
    }
];

// ── Event Links ──────────────────────────────────
const EVENT_LINKS = [
    // ── The Ring's Journey ──
    { from: "one-ring-forged", to: "eregion-rings", type: "cause", label: "Elves perceive Sauron's treachery" },
    { from: "one-ring-forged", to: "last-alliance", type: "cause", label: "Leads to the Last Alliance" },
    { from: "last-alliance", to: "gladden-fields", type: "sequel", label: "Isildur loses the Ring" },
    { from: "gladden-fields", to: "gollum-origin", type: "sequel", label: "Ring found by D\u00e9agol centuries later" },
    { from: "gollum-origin", to: "riddles-in-dark", type: "sequel", label: "Bilbo finds the Ring" },
    { from: "riddles-in-dark", to: "bilbo-farewell", type: "sequel", label: "Ring passes to Frodo" },
    { from: "bilbo-farewell", to: "council-elrond", type: "sequel", label: "The Quest is formed" },
    { from: "council-elrond", to: "mount-doom-end", type: "sequel", label: "The Ring is destroyed" },

    // ── Gandalf's arc ──
    { from: "dol-guldur-shadow", to: "dol-guldur-council", type: "sequel", label: "White Council drives out Sauron" },

    // ── N\u00famenor → Exile Kingdoms ──
    { from: "numenor-downfall", to: "annuminas", type: "sequel", label: "Faithful found Arnor" },
    { from: "numenor-downfall", to: "last-alliance", type: "cause", label: "Exiles confront Sauron" },

    // ── Northern Kingdom ──
    { from: "annuminas", to: "fornost-fall", type: "sequel", label: "Capital moves to Fornost, then falls" },
    { from: "carn-dum", to: "fornost-fall", type: "cause", label: "Angmar destroys Arthedain" },
    { from: "fornost-fall", to: "forochel", type: "sequel", label: "Last king flees north" },

    // ── Rohan ──
    { from: "field-celebrant", to: "edoras", type: "legacy", label: "Rohan endures for 500 years" },
    { from: "fords-isen", to: "helms-deep", type: "cause", label: "Rohan leaderless as war comes" },

    // ── Parallel events (War of the Ring) ──
    { from: "helms-deep", to: "dead-marshes", type: "parallel", label: "Simultaneous events" },
    { from: "helms-deep", to: "isengard-ents", type: "parallel", label: "Simultaneous events" },
    { from: "pelennor-fields", to: "tower-cirith-ungol", type: "parallel", label: "Simultaneous events" },
    { from: "black-gate", to: "mount-doom-end", type: "parallel", label: "Distraction enables the Ring's destruction" },

    // ── Hobbit → LOTR connections ──
    { from: "unexpected-party", to: "bilbo-farewell", type: "sequel", label: "Bilbo's later years" },
    { from: "five-armies", to: "council-elrond", type: "legacy", label: "Erebor sends envoy to Rivendell" },
    { from: "dol-guldur-council", to: "dol-guldur-shadow", type: "sequel", label: "Sauron driven out but returns to Mordor" },

    // ── Location echoes across ages ──
    { from: "khazad-dum-awakening", to: "bridge-khazad-dum", type: "location", label: "Same halls, millennia apart" },
    { from: "barad-dur-built", to: "mount-doom-end", type: "location", label: "The Dark Tower falls at last" },
    { from: "one-ring-forged", to: "mount-doom-end", type: "location", label: "Forged and destroyed in the same fire" },
    { from: "eregion-rings", to: "doors-durin", type: "location", label: "Near the West-gate of Moria" },

    // ── Breaking of the Fellowship ──
    { from: "amon-hen", to: "eaves-fangorn", type: "sequel", label: "Merry and Pippin taken to Fangorn" },
    { from: "eaves-fangorn", to: "fangorn-treebeard", type: "sequel", label: "Hobbits flee into the forest" },
    { from: "bridge-khazad-dum", to: "fangorn-white-wizard", type: "sequel", label: "Gandalf returns as the White" },
    { from: "amon-hen", to: "emyn-muil", type: "sequel", label: "Frodo and Sam go alone to Mordor" },

    // ── Scouring ──
    { from: "orthanc-saruman", to: "bywater-scouring", type: "sequel", label: "Saruman takes revenge on the Shire" },
    { from: "sarn-ford", to: "bucklebury-ferry", type: "cause", label: "Nazg\u00fbl enter the Shire" },

    // ── The Shire ──
    { from: "shire-homeland", to: "unexpected-party", type: "legacy", label: "Where the story begins" },
    { from: "bywater-scouring", to: "westmarch", type: "sequel", label: "The Shire is restored and extended" },

    // ── Dwarven heritage ──
    { from: "ered-luin", to: "khazad-dum-awakening", type: "legacy", label: "Dwarven kingdoms east and west" },
    { from: "withered-heath", to: "erebor-inside", type: "cause", label: "Smaug descends from the north" }
];

// ── Journey Paths ──────────────────────────────
// Shared Fellowship path: Rivendell to Rauros Falls
const FELLOWSHIP_PATH = [
    [3940, 1096],  // Rivendell
    [3930, 1190],  // South from Rivendell
    [3915, 1280],  // Western foothills
    [3900, 1370],  // Hollin (Eregion)
    [3930, 1440],  // Approaching Caradhras
    [3940, 1490],  // Doors of Durin
    [3981, 1515],  // Moria
    [4026, 1516],  // Dimrill Dale
    [4214, 1609],  // Lothl\u00f3rien
    [4224, 1658, 1],  // Nimrodel
    [4261, 1661, 1],  // Nimrodel
    [4289, 1684, 1],  // Nimrodel
    [4320, 1686, 1],  // Nimrodel merges into the Anduin
    [4355, 1707, 1],  // Anduin
    [4365, 1724, 1],  // Anduin
    [4356, 1744, 1],  // Anduin
    [4396, 1747, 1],  // Anduin
    [4417, 1729, 1],  // Anduin
    [4464, 1744, 1],  // Anduin
    [4471, 1771, 1],  // Anduin
    [4465, 1788, 1],  // Anduin
    [4452, 1813, 1],  // Anduin
    [4479, 1838, 1],  // Anduin
    [4499, 1840, 1],  // Anduin
    [4531, 1829, 1],  // Anduin
    [4558, 1837, 1],  // Anduin
    [4574, 1867, 1],  // Anduin
    [4559, 1892, 1],  // Anduin
    [4533, 1929, 1],  // Anduin
    [4563, 1966, 1],  // Anduin
    [4561, 2016, 1],  // Anduin
    [4561, 2016, 1],  // Anduin
    [4512, 2088, 1],  // Anduin
    [4511, 2105],  // Argonath
    [4480, 2174],  // Amon Hen
    [4502, 2196]   // Rauros Falls
];

const JOURNEYS = {
    fellowship: {
        label: "The Fellowship",
        color: '#7b2d8e',
        points: FELLOWSHIP_PATH
    },
    bilbo: {
        label: "Bilbo's Journey",
        color: '#5b8fb9',
        points: [
            [2746, 1115],  // Bag End
            [2974, 1126],  // Brandywine Bridge
            [3254, 1139],  // Bree
            [3370, 1175],  // East Road
            [3491, 1195],  // East Road
            [3590, 1185],  // East Road
            [3681, 1154],  // Last Bridge
            [3811, 937],   // Trollshaws
            [3850, 1134],  // Ford of Bruinen
            [3922, 1096],  // Rivendell
            [4094, 1049],  // Misty Mountains
            [4319, 976],   // Carrock
            [4444, 944],   // Beorn's Hall
            [4637, 945],   // Mirkwood
            [4815, 962],   // Thranduil's Halls
            [5105, 1125],  // Lake-town
            [5161, 941],   // Erebor
            [5105, 1125],  // Lake-town (return)
            [4444, 944],   // Beorn's Hall
            [3922, 1096],  // Rivendell
            [3681, 1154],  // Last Bridge (return)
            [3590, 1200],  // East Road
            [3491, 1210],  // East Road
            [3370, 1190],  // East Road
            [3254, 1139],  // Bree (return)
            [2974, 1126],  // Brandywine Bridge
            [2746, 1115],  // Bag End (home)
            [2974, 1126],  // Brandywine Bridge (retirement)
            [3681, 1154],  // Last Bridge
            [3922, 1096],  // Rivendell (retires here)
            [3681, 1154],  // Last Bridge (Grey Havens)
            [2974, 1126],  // Brandywine Bridge
            [2266, 1150]   // Grey Havens
        ]
    },
    frodo: {
        label: "Frodo's Journey",
        color: '#c0392b',
        points: [
            [2764, 1115],  // Bag End
            [2988, 1178],  // Bucklebury Ferry
            [3034, 1204],  // Crickhollow
            [3098, 1178],  // Old Forest
            [3185, 1144],  // Barrow-downs
            [3254, 1139],  // Bree
            [3367, 1084],  // Midgewater Marshes
            [3484, 1097],  // Weathertop
            [3681, 1154],  // Last Bridge
            [3850, 1134],  // Ford of Bruinen
            ...FELLOWSHIP_PATH,
            [4623, 2147],  // Emyn Muil
            [4894, 2150],  // Dead Marshes
            [5050, 2280],  // North Ithilien
            [5029, 2491],  // Henneth Ann\u00fbn
            [4927, 2678],  // Cross-roads
            [5033, 2660],  // Minas Morgul
            [5082, 2526],  // Cirith Ungol
            [5120, 2530],  // Tower of Cirith Ungol
            [5419, 2532],  // Mount Doom
            [4799, 2565],  // Field of Cormallen
            [4720, 2641],  // Minas Tirith
            [3969, 2344],  // Edoras
            [3849, 2295],  // en route to Helm's Deep
            [3760, 2277],  // Helm's Deep
            [3775, 2039],  // Isengard
            [3742, 2135],  // Gap of Rohan
            [3550, 1850],  // Dunland
            [3500, 1500],  // Eriador
            [3940, 1096],  // Rivendell
            [3850, 1134],  // Ford of Bruinen
            [3681, 1154],  // Last Bridge
            [3254, 1139],  // Bree
            [2974, 1126],  // Brandywine Bridge
            [2848, 1147],  // Bywater
            [2764, 1115],  // Bag End
            [2974, 1126],  // Brandywine Bridge
            [2266, 1150]   // Grey Havens
        ]
    },
    aragorn: {
        label: "Aragorn's Journey",
        color: '#6a9f5b',
        points: [
            [3254, 1139],  // Bree
            [3367, 1084],  // Midgewater Marshes
            [3484, 1097],  // Weathertop
            [3681, 1154],  // Last Bridge
            [3850, 1134],  // Ford of Bruinen
            ...FELLOWSHIP_PATH,
            [4017, 2086],  // Eaves of Fangorn
            [4004, 2000],  // Fangorn (White Wizard)
            [3969, 2344],  // Edoras
            [3849, 2295],  // en route to Helm's Deep
            [3760, 2277],  // Helm's Deep
            [3775, 2039],  // Isengard
            [3969, 2344],  // Edoras (return)
            [4005, 2440],  // Dunharrow
            [3886, 2470],  // Erech
            [4509, 2977],  // Pelargir
            [4784, 2638],  // Pelennor Fields
            [4720, 2641],  // Minas Tirith
            [4939, 2329],  // Ithilien
            [5051, 2250],  // Dagorlad
            [5141, 2272],  // Black Gate
            [5051, 2250],  // Dagorlad (return)
            [4939, 2329],  // Ithilien (return)
            [4799, 2565],  // Field of Cormallen
            [4720, 2641]   // Minas Tirith (coronation)
        ]
    },
    boromir: {
        label: "Boromir's Journey",
        color: '#8e6b3e',
        points: [
            [4720, 2641],  // Minas Tirith
            [4400, 2550],  // Anorien
            [4100, 2400],  // Rohan
            [3742, 2135],  // Gap of Rohan
            [3574, 2022],  // Dunland
            [3550, 1850],  // Enedwaith
            [3372, 1578],  // Tharbad
            [3500, 1350],  // Lone-lands
            [3681, 1154],  // Last Bridge
            [3850, 1134],  // Ford of Bruinen
            ...FELLOWSHIP_PATH
        ]
    },
    merry_pippin: {
        label: "Merry & Pippin's Journey",
        color: '#d4813a',
        points: [
            [2764, 1115],  // Bag End
            [2988, 1178],  // Bucklebury Ferry
            [3034, 1204],  // Crickhollow
            [3098, 1178],  // Old Forest
            [3185, 1144],  // Barrow-downs
            [3254, 1139],  // Bree
            [3367, 1084],  // Midgewater Marshes
            [3484, 1097],  // Weathertop
            [3681, 1154],  // Last Bridge
            [3850, 1134],  // Ford of Bruinen
            ...FELLOWSHIP_PATH.slice(0, -1),  // Up to Amon Hen (excludes Rauros Falls)
            [4017, 2086],  // Eaves of Fangorn
            [4043, 1918],  // Fangorn
            [3775, 2039]   // Isengard
        ],
        branches: {
            pippin: [
                [3775, 2039],  // Isengard
                [3742, 2135],  // Gap of Rohan
                [3969, 2380],  // Edoras
                [4400, 2550],  // Anorien
                [4720, 2641],  // Minas Tirith
                [4784, 2638],  // Pelennor Fields
                [4939, 2329],  // Ithilien
                [5051, 2250],  // Dagorlad
                [5141, 2272],  // Black Gate
                [5051, 2250],  // Dagorlad (return)
                [4939, 2329],  // Ithilien (return)
                [4799, 2565],  // Field of Cormallen
                [4720, 2641],  // Minas Tirith (coronation)
                [3969, 2344],  // Edoras
                [3760, 2277],  // Helm's Deep
                [3775, 2039],  // Isengard
                [3742, 2135],  // Gap of Rohan
                [3550, 1850],  // Dunland
                [3500, 1500],  // Eriador
                [3940, 1096],  // Rivendell
                [3850, 1134],  // Ford of Bruinen
                [3681, 1154],  // Last Bridge
                [3254, 1139],  // Bree
                [2974, 1126],  // Brandywine Bridge
                [2848, 1147],  // Bywater
                [2764, 1115]   // Bag End
            ],
            merry: {
                color: '#c4a24a',
                points: [
                    [3775, 2039],  // Isengard
                    [3969, 2344],  // Edoras
                    [4005, 2440],  // Dunharrow
                    [4618, 2531],  // Dr\u00faadan Forest
                    [4784, 2638],  // Pelennor Fields
                    [4939, 2329],  // Ithilien
                    [5051, 2250],  // Dagorlad
                    [5141, 2272],  // Black Gate
                    [5051, 2250],  // Dagorlad (return)
                    [4939, 2329],  // Ithilien (return)
                    [4799, 2565],  // Field of Cormallen
                    [4720, 2641],  // Minas Tirith (coronation)
                    [3969, 2344],  // Edoras
                    [3760, 2277],  // Helm's Deep
                    [3775, 2039],  // Isengard
                    [3742, 2135],  // Gap of Rohan
                    [3550, 1850],  // Dunland
                    [3500, 1500],  // Eriador
                    [3940, 1096],  // Rivendell
                    [3850, 1134],  // Ford of Bruinen
                    [3681, 1154],  // Last Bridge
                    [3254, 1139],  // Bree
                    [2974, 1126],  // Brandywine Bridge
                    [2848, 1147],  // Bywater
                    [2764, 1115]   // Bag End
                ]
            }
        }
    },
    gollum: {
        label: "Gollum's Journey",
        color: '#708090',
        points: [
            [4434, 1380],  // River-folk
            [4434, 1380],  // Gladden Fields
            [4094, 1049],  // Misty Mountains
            [4400, 1360],  // Gladden Fields
            [4463, 1801],  // Anduin valley
            [4623, 2147],  // Emyn Muil
            [4894, 2150],  // Dead Marshes
            [5141, 2272],  // Black Gate
            [4894, 2150],  // Dead Marshes
            [4463, 1801],  // Anduin valley
            [3981, 1515],  // Moria
            [4026, 1516],  // Dimrill Dale
            [4300, 1609],  // East of Lothl\u00f3rien
            [4463, 1801],  // Anduin
            [4569, 1985],  // Anduin
            [4511, 2105],  // Argonath area
            [4623, 2147],  // Emyn Muil
            [4894, 2150],  // Dead Marshes
            [5141, 2272],  // Black Gate
            [5029, 2491],  // Henneth Ann\u00fbn
            [5033, 2660],  // Minas Morgul
            [5082, 2526],  // Cirith Ungol
            [5120, 2530],  // Tower of Cirith Ungol
            [5419, 2532]   // Mount Doom
        ]
    },
    gandalf_hobbit: {
        label: "Gandalf's Journey (Hobbit)",
        color: '#00bcd4',
        points: [
            [2746, 1115],  // Bag End
            [2974, 1126],  // Brandywine Bridge
            [3254, 1139],  // Bree
            [3370, 1175],  // East Road
            [3491, 1195],  // East Road
            [3590, 1185],  // East Road
            [3681, 1154],  // Last Bridge
            [3811, 937],   // Trollshaws
            [3850, 1134],  // Ford of Bruinen
            [3922, 1096],  // Rivendell
            [4094, 1049],  // Misty Mountains
            [4319, 976],   // Carrock
            [4444, 944],   // Beorn's Hall
            [4444, 944]    // Leaves company
        ],
        branches: {
            dol_guldur: [
                [4444, 944],   // Leaves company
                [4672, 1578],  // Dol Guldur
                [5161, 941]    // Erebor
            ]
        }
    },
    gandalf_lotr: {
        label: "Gandalf's Journey (LOTR)",
        color: '#00bcd4',
        points: [
            [2764, 1115],  // Bag End
            [4720, 2641],  // Minas Tirith
            [2764, 1115],  // Bag End
            [3775, 2039],  // Isengard
            [3969, 2344],  // Edoras
            [3484, 1097],  // Weathertop
            [3681, 1154],  // Last Bridge
            [3940, 1096],  // Rivendell
            [3930, 1190],  // South from Rivendell
            [3915, 1280],  // Western foothills
            [3900, 1370],  // Hollin
            [3930, 1440],  // Approaching Caradhras
            [3981, 1515],  // Moria (falls)
            [4004, 2000],  // Fangorn (returns as the White)
            [3969, 2344],  // Edoras
            [3849, 2295],  // en route to Helm's Deep
            [3760, 2277],  // Helm's Deep
            [3700, 2104],  // Fords of Isen (rallies Erkenbrand)
            [3760, 2277],  // Helm's Deep (returns at dawn)
            [3775, 2039],  // Isengard
            [3742, 2135],  // Gap of Rohan
            [3969, 2380],  // Edoras
            [4400, 2550],  // Anorien
            [4720, 2641],  // Minas Tirith
            [4784, 2638],  // Pelennor Fields
            [4939, 2329],  // Ithilien
            [5051, 2250],  // Dagorlad
            [5141, 2272],  // Black Gate
            [5051, 2250],  // Dagorlad (return)
            [4939, 2329],  // Ithilien (return)
            [4799, 2565],  // Field of Cormallen
            [4720, 2641]   // Minas Tirith (coronation)
        ]
    }
};
