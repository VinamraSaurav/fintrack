/**
 * Comprehensive seed script for canonical items.
 * 300+ items covering groceries, household, transport, utilities, health, etc.
 * Each item has Hindi/regional aliases for smart normalization.
 */

export const SEED_ITEMS: {
  name: string;
  category: string;
  aliases: string[];
}[] = [
  // ══════════════════════════════════════════════════════════════════════════
  // GROCERIES
  // ══════════════════════════════════════════════════════════════════════════

  // ── Vegetables ──────────────────────────────────────────────────────────
  { name: 'Potato', category: 'cat_groceries', aliases: ['aloo', 'alu', 'aaloo', 'batata', 'potatoes'] },
  { name: 'Onion', category: 'cat_groceries', aliases: ['pyaz', 'pyazz', 'pyaaz', 'kanda', 'onions'] },
  { name: 'Tomato', category: 'cat_groceries', aliases: ['tamatar', 'tamaatar', 'tamato', 'tomatoes'] },
  { name: 'Ginger', category: 'cat_groceries', aliases: ['adrak', 'adrakh', 'ginger root'] },
  { name: 'Garlic', category: 'cat_groceries', aliases: ['lahsun', 'lasun', 'lehsun'] },
  { name: 'Green Chili', category: 'cat_groceries', aliases: ['hari mirch', 'mirchi', 'green chilli', 'chilli'] },
  { name: 'Coriander', category: 'cat_groceries', aliases: ['dhaniya', 'dhania', 'cilantro', 'hara dhaniya'] },
  { name: 'Spinach', category: 'cat_groceries', aliases: ['palak', 'paalak'] },
  { name: 'Cauliflower', category: 'cat_groceries', aliases: ['gobhi', 'gobi', 'phool gobi'] },
  { name: 'Cabbage', category: 'cat_groceries', aliases: ['patta gobhi', 'band gobhi'] },
  { name: 'Capsicum', category: 'cat_groceries', aliases: ['shimla mirch', 'bell pepper', 'green pepper'] },
  { name: 'Carrot', category: 'cat_groceries', aliases: ['gajar', 'gaajar', 'carrots'] },
  { name: 'Peas', category: 'cat_groceries', aliases: ['matar', 'mattar', 'green peas'] },
  { name: 'Brinjal', category: 'cat_groceries', aliases: ['baingan', 'baigan', 'eggplant', 'aubergine'] },
  { name: 'Okra', category: 'cat_groceries', aliases: ['bhindi', 'bhendi', 'lady finger', 'ladyfinger'] },
  { name: 'Bitter Gourd', category: 'cat_groceries', aliases: ['karela', 'bitter melon'] },
  { name: 'Bottle Gourd', category: 'cat_groceries', aliases: ['lauki', 'ghiya', 'dudhi'] },
  { name: 'Ridge Gourd', category: 'cat_groceries', aliases: ['tori', 'torai', 'turai'] },
  { name: 'Radish', category: 'cat_groceries', aliases: ['mooli', 'muli'] },
  { name: 'Beetroot', category: 'cat_groceries', aliases: ['chukandar', 'beet'] },
  { name: 'Sweet Potato', category: 'cat_groceries', aliases: ['shakarkandi', 'shakarkand'] },
  { name: 'Mushroom', category: 'cat_groceries', aliases: ['khumbi', 'mushrooms'] },
  { name: 'Lemon', category: 'cat_groceries', aliases: ['nimbu', 'neembu', 'lime', 'lemons'] },
  { name: 'Cucumber', category: 'cat_groceries', aliases: ['kheera', 'khira', 'kakdi'] },
  { name: 'Corn', category: 'cat_groceries', aliases: ['makka', 'bhutta', 'maize', 'sweet corn'] },
  { name: 'Pumpkin', category: 'cat_groceries', aliases: ['kaddu', 'kumhda', 'sitaphal'] },
  { name: 'Drumstick', category: 'cat_groceries', aliases: ['sahjan', 'moringa'] },
  { name: 'Spring Onion', category: 'cat_groceries', aliases: ['hara pyaz', 'green onion', 'scallion'] },
  { name: 'Curry Leaves', category: 'cat_groceries', aliases: ['kadi patta', 'meetha neem'] },
  { name: 'Mint', category: 'cat_groceries', aliases: ['pudina', 'peppermint'] },
  { name: 'Methi', category: 'cat_groceries', aliases: ['fenugreek', 'methi leaves', 'kasuri methi'] },
  { name: 'Lettuce', category: 'cat_groceries', aliases: ['salad patta', 'lettuce leaves'] },
  { name: 'Broccoli', category: 'cat_groceries', aliases: ['hari gobi'] },
  { name: 'Zucchini', category: 'cat_groceries', aliases: ['courgette'] },
  { name: 'Jackfruit', category: 'cat_groceries', aliases: ['kathal', 'katahal'] },
  { name: 'Raw Banana', category: 'cat_groceries', aliases: ['kacha kela', 'plantain'] },
  { name: 'Ivy Gourd', category: 'cat_groceries', aliases: ['kundru', 'tindora'] },
  { name: 'Cluster Beans', category: 'cat_groceries', aliases: ['gawar', 'guar phali'] },
  { name: 'Pointed Gourd', category: 'cat_groceries', aliases: ['parwal', 'parval'] },

  // ── Fruits ──────────────────────────────────────────────────────────────
  { name: 'Apple', category: 'cat_groceries', aliases: ['seb', 'saib', 'apples'] },
  { name: 'Banana', category: 'cat_groceries', aliases: ['kela', 'bananas'] },
  { name: 'Mango', category: 'cat_groceries', aliases: ['aam', 'mangoes', 'mangos'] },
  { name: 'Grapes', category: 'cat_groceries', aliases: ['angoor', 'angur'] },
  { name: 'Orange', category: 'cat_groceries', aliases: ['santra', 'narangi', 'oranges'] },
  { name: 'Watermelon', category: 'cat_groceries', aliases: ['tarbooz', 'tarbuz'] },
  { name: 'Papaya', category: 'cat_groceries', aliases: ['papita', 'papeeta'] },
  { name: 'Pomegranate', category: 'cat_groceries', aliases: ['anaar', 'anar'] },
  { name: 'Guava', category: 'cat_groceries', aliases: ['amrood', 'amrud'] },
  { name: 'Pineapple', category: 'cat_groceries', aliases: ['ananas'] },
  { name: 'Coconut', category: 'cat_groceries', aliases: ['nariyal', 'narikel'] },
  { name: 'Litchi', category: 'cat_groceries', aliases: ['lychee', 'lichi'] },
  { name: 'Kiwi', category: 'cat_groceries', aliases: ['kiwi fruit'] },
  { name: 'Strawberry', category: 'cat_groceries', aliases: ['strawberries'] },
  { name: 'Pear', category: 'cat_groceries', aliases: ['nashpati', 'pears'] },
  { name: 'Plum', category: 'cat_groceries', aliases: ['aloo bukhara', 'plums'] },
  { name: 'Cherry', category: 'cat_groceries', aliases: ['cherries'] },
  { name: 'Custard Apple', category: 'cat_groceries', aliases: ['sharifa', 'sitafal'] },
  { name: 'Fig', category: 'cat_groceries', aliases: ['anjeer', 'figs'] },
  { name: 'Dates', category: 'cat_groceries', aliases: ['khajoor', 'khajur'] },
  { name: 'Blueberry', category: 'cat_groceries', aliases: ['blueberries'] },
  { name: 'Avocado', category: 'cat_groceries', aliases: ['butter fruit'] },
  { name: 'Dragon Fruit', category: 'cat_groceries', aliases: ['pitaya'] },
  { name: 'Muskmelon', category: 'cat_groceries', aliases: ['kharbooja', 'cantaloupe'] },
  { name: 'Chikoo', category: 'cat_groceries', aliases: ['sapota', 'sapodilla'] },
  { name: 'Jamun', category: 'cat_groceries', aliases: ['java plum', 'black plum'] },
  { name: 'Amla', category: 'cat_groceries', aliases: ['indian gooseberry', 'awla'] },

  // ── Dairy ───────────────────────────────────────────────────────────────
  { name: 'Milk', category: 'cat_groceries', aliases: ['doodh', 'dudh', 'dud', 'full cream milk', 'toned milk'] },
  { name: 'Curd', category: 'cat_groceries', aliases: ['dahi', 'yogurt', 'yoghurt'] },
  { name: 'Butter', category: 'cat_groceries', aliases: ['makhan', 'makkhan', 'amul butter'] },
  { name: 'Paneer', category: 'cat_groceries', aliases: ['cottage cheese', 'paner'] },
  { name: 'Cheese', category: 'cat_groceries', aliases: ['cheez', 'cheese slice', 'processed cheese'] },
  { name: 'Ghee', category: 'cat_groceries', aliases: ['desi ghee', 'clarified butter'] },
  { name: 'Cream', category: 'cat_groceries', aliases: ['malai', 'fresh cream', 'heavy cream'] },
  { name: 'Buttermilk', category: 'cat_groceries', aliases: ['chaach', 'mattha', 'lassi'] },
  { name: 'Khoya', category: 'cat_groceries', aliases: ['mawa', 'khoa'] },
  { name: 'Ice Cream', category: 'cat_groceries', aliases: ['kulfi', 'gelato'] },

  // ── Staples & Grains ───────────────────────────────────────────────────
  { name: 'Rice', category: 'cat_groceries', aliases: ['chawal', 'chaawal', 'basmati', 'basmati rice'] },
  { name: 'Wheat Flour', category: 'cat_groceries', aliases: ['atta', 'aata', 'gehun', 'wheat', 'chakki atta'] },
  { name: 'Sugar', category: 'cat_groceries', aliases: ['cheeni', 'chini', 'shakkar'] },
  { name: 'Salt', category: 'cat_groceries', aliases: ['namak', 'namk', 'rock salt', 'sendha namak'] },
  { name: 'Jaggery', category: 'cat_groceries', aliases: ['gur', 'gud'] },
  { name: 'Honey', category: 'cat_groceries', aliases: ['shahad', 'madhu'] },
  { name: 'Maida', category: 'cat_groceries', aliases: ['refined flour', 'all purpose flour'] },
  { name: 'Besan', category: 'cat_groceries', aliases: ['gram flour', 'chickpea flour'] },
  { name: 'Sooji', category: 'cat_groceries', aliases: ['suji', 'rava', 'semolina'] },
  { name: 'Poha', category: 'cat_groceries', aliases: ['flattened rice', 'chivda', 'beaten rice'] },
  { name: 'Oats', category: 'cat_groceries', aliases: ['rolled oats', 'oatmeal'] },
  { name: 'Cornflour', category: 'cat_groceries', aliases: ['corn starch', 'makke ka atta'] },
  { name: 'Vermicelli', category: 'cat_groceries', aliases: ['seviyan', 'sewai'] },
  { name: 'Pasta', category: 'cat_groceries', aliases: ['macaroni', 'penne', 'spaghetti'] },
  { name: 'Noodles', category: 'cat_groceries', aliases: ['maggi', 'instant noodles', 'chowmein'] },
  { name: 'Bread', category: 'cat_groceries', aliases: ['double roti', 'pav', 'brown bread', 'white bread', 'toast'] },
  { name: 'Eggs', category: 'cat_groceries', aliases: ['anda', 'ande', 'egg', 'tray eggs'] },

  // ── Pulses & Lentils ───────────────────────────────────────────────────
  { name: 'Toor Dal', category: 'cat_groceries', aliases: ['arhar dal', 'pigeon pea', 'tur dal'] },
  { name: 'Moong Dal', category: 'cat_groceries', aliases: ['green gram', 'mung dal', 'mung bean'] },
  { name: 'Chana Dal', category: 'cat_groceries', aliases: ['bengal gram', 'split chickpea'] },
  { name: 'Urad Dal', category: 'cat_groceries', aliases: ['black gram', 'urad', 'dhuli urad'] },
  { name: 'Masoor Dal', category: 'cat_groceries', aliases: ['red lentils', 'masur dal'] },
  { name: 'Rajma', category: 'cat_groceries', aliases: ['kidney beans', 'rajmah'] },
  { name: 'Chole', category: 'cat_groceries', aliases: ['chickpeas', 'kabuli chana', 'chana'] },
  { name: 'Soybean', category: 'cat_groceries', aliases: ['soya', 'soya chunks', 'nutrela'] },
  { name: 'Peanuts', category: 'cat_groceries', aliases: ['moongfali', 'groundnut', 'mungfali'] },
  { name: 'Black Eyed Peas', category: 'cat_groceries', aliases: ['lobia', 'rongi'] },

  // ── Oils ────────────────────────────────────────────────────────────────
  { name: 'Mustard Oil', category: 'cat_groceries', aliases: ['sarson ka tel', 'sarso oil'] },
  { name: 'Refined Oil', category: 'cat_groceries', aliases: ['soybean oil', 'sunflower oil', 'cooking oil', 'tel'] },
  { name: 'Olive Oil', category: 'cat_groceries', aliases: ['jaitun ka tel'] },
  { name: 'Coconut Oil', category: 'cat_groceries', aliases: ['nariyal tel', 'copra oil'] },
  { name: 'Groundnut Oil', category: 'cat_groceries', aliases: ['peanut oil', 'moongfali tel'] },
  { name: 'Sesame Oil', category: 'cat_groceries', aliases: ['til ka tel', 'gingelly oil'] },

  // ── Spices & Masala ────────────────────────────────────────────────────
  { name: 'Turmeric', category: 'cat_groceries', aliases: ['haldi', 'haldie', 'turmeric powder'] },
  { name: 'Red Chili Powder', category: 'cat_groceries', aliases: ['lal mirch', 'mirch powder', 'red chilli'] },
  { name: 'Cumin', category: 'cat_groceries', aliases: ['jeera', 'zeera', 'cumin seeds', 'cumin powder'] },
  { name: 'Mustard Seeds', category: 'cat_groceries', aliases: ['rai', 'sarson', 'mustard'] },
  { name: 'Coriander Powder', category: 'cat_groceries', aliases: ['dhania powder', 'dhaniya powder'] },
  { name: 'Garam Masala', category: 'cat_groceries', aliases: ['garam masala powder', 'mixed spices'] },
  { name: 'Black Pepper', category: 'cat_groceries', aliases: ['kali mirch', 'pepper', 'peppercorn'] },
  { name: 'Cardamom', category: 'cat_groceries', aliases: ['elaichi', 'ilaichi', 'green cardamom'] },
  { name: 'Clove', category: 'cat_groceries', aliases: ['laung', 'long', 'cloves'] },
  { name: 'Cinnamon', category: 'cat_groceries', aliases: ['dalchini', 'dalcheeni'] },
  { name: 'Bay Leaf', category: 'cat_groceries', aliases: ['tej patta', 'tejpatta'] },
  { name: 'Fennel', category: 'cat_groceries', aliases: ['saunf', 'fennel seeds'] },
  { name: 'Ajwain', category: 'cat_groceries', aliases: ['carom seeds', 'bishop weed'] },
  { name: 'Hing', category: 'cat_groceries', aliases: ['asafoetida', 'heeng'] },
  { name: 'Dry Mango Powder', category: 'cat_groceries', aliases: ['amchur', 'amchoor'] },
  { name: 'Chaat Masala', category: 'cat_groceries', aliases: ['chat masala'] },
  { name: 'Pav Bhaji Masala', category: 'cat_groceries', aliases: ['pav bhaji mix'] },
  { name: 'Biryani Masala', category: 'cat_groceries', aliases: ['biryani mix'] },
  { name: 'Kitchen King Masala', category: 'cat_groceries', aliases: ['sabzi masala'] },
  { name: 'Sambhar Masala', category: 'cat_groceries', aliases: ['sambar powder'] },
  { name: 'Star Anise', category: 'cat_groceries', aliases: ['chakra phool'] },
  { name: 'Nutmeg', category: 'cat_groceries', aliases: ['jaiphal', 'jaayfal'] },
  { name: 'Saffron', category: 'cat_groceries', aliases: ['kesar', 'zafran'] },

  // ── Dry Fruits & Nuts ──────────────────────────────────────────────────
  { name: 'Almonds', category: 'cat_groceries', aliases: ['badam', 'almond'] },
  { name: 'Cashew', category: 'cat_groceries', aliases: ['kaju', 'cashews', 'cashew nuts'] },
  { name: 'Walnuts', category: 'cat_groceries', aliases: ['akhrot', 'walnut'] },
  { name: 'Pistachios', category: 'cat_groceries', aliases: ['pista', 'pistachio'] },
  { name: 'Raisins', category: 'cat_groceries', aliases: ['kishmish', 'kismis', 'munakka'] },
  { name: 'Dried Coconut', category: 'cat_groceries', aliases: ['copra', 'sukha nariyal'] },
  { name: 'Flax Seeds', category: 'cat_groceries', aliases: ['alsi', 'flaxseed'] },
  { name: 'Chia Seeds', category: 'cat_groceries', aliases: ['chia'] },
  { name: 'Sunflower Seeds', category: 'cat_groceries', aliases: ['surajmukhi beej'] },
  { name: 'Pumpkin Seeds', category: 'cat_groceries', aliases: ['kaddu beej'] },
  { name: 'Fox Nuts', category: 'cat_groceries', aliases: ['makhana', 'lotus seeds'] },

  // ── Beverages ───────────────────────────────────────────────────────────
  { name: 'Tea', category: 'cat_groceries', aliases: ['chai', 'chay', 'tea leaves', 'tea powder', 'chai patti'] },
  { name: 'Coffee', category: 'cat_groceries', aliases: ['kaafi', 'coffee powder', 'instant coffee', 'nescafe'] },
  { name: 'Green Tea', category: 'cat_groceries', aliases: ['herbal tea'] },
  { name: 'Soft Drink', category: 'cat_groceries', aliases: ['cold drink', 'coke', 'pepsi', 'soda', 'cola', 'sprite', 'fanta', 'thumbs up'] },
  { name: 'Juice', category: 'cat_groceries', aliases: ['fruit juice', 'mango juice', 'orange juice', 'real juice'] },
  { name: 'Mineral Water', category: 'cat_groceries', aliases: ['water bottle', 'packaged water', 'bisleri', 'kinley'] },
  { name: 'Coconut Water', category: 'cat_groceries', aliases: ['nariyal pani', 'tender coconut'] },
  { name: 'Horlicks', category: 'cat_groceries', aliases: ['health drink', 'bournvita', 'boost', 'complan'] },
  { name: 'Lemonade', category: 'cat_groceries', aliases: ['nimbu pani', 'shikanji'] },

  // ── Packaged & Snacks ──────────────────────────────────────────────────
  { name: 'Chips', category: 'cat_groceries', aliases: ['lays', 'kurkure', 'wafers', 'potato chips', 'crisps'] },
  { name: 'Biscuits', category: 'cat_groceries', aliases: ['biscuit', 'cookies', 'parle g', 'oreo', 'marie gold'] },
  { name: 'Namkeen', category: 'cat_groceries', aliases: ['mixture', 'bhujia', 'sev', 'haldiram'] },
  { name: 'Chocolate', category: 'cat_groceries', aliases: ['cadbury', 'dairy milk', 'kitkat', 'munch'] },
  { name: 'Cake', category: 'cat_groceries', aliases: ['pastry', 'muffin', 'cupcake'] },
  { name: 'Jam', category: 'cat_groceries', aliases: ['jelly', 'fruit preserve', 'marmalade'] },
  { name: 'Ketchup', category: 'cat_groceries', aliases: ['tomato sauce', 'tomato ketchup', 'maggi sauce'] },
  { name: 'Pickles', category: 'cat_groceries', aliases: ['achar', 'achaar'] },
  { name: 'Papad', category: 'cat_groceries', aliases: ['papadum', 'poppadom'] },
  { name: 'Sauce', category: 'cat_groceries', aliases: ['soy sauce', 'chilli sauce', 'hot sauce', 'schezwan sauce'] },
  { name: 'Vinegar', category: 'cat_groceries', aliases: ['sirka'] },
  { name: 'Mayonnaise', category: 'cat_groceries', aliases: ['mayo'] },
  { name: 'Peanut Butter', category: 'cat_groceries', aliases: ['peanut spread'] },
  { name: 'Cereal', category: 'cat_groceries', aliases: ['cornflakes', 'muesli', 'granola', 'chocos'] },
  { name: 'Popcorn', category: 'cat_groceries', aliases: ['makke ke dane'] },
  { name: 'Rusk', category: 'cat_groceries', aliases: ['toast rusk', 'suji rusk'] },

  // ── Frozen & Ready to Eat ──────────────────────────────────────────────
  { name: 'Frozen Peas', category: 'cat_groceries', aliases: ['frozen matar'] },
  { name: 'Frozen Corn', category: 'cat_groceries', aliases: ['frozen sweet corn'] },
  { name: 'Frozen Paratha', category: 'cat_groceries', aliases: ['ready paratha'] },
  { name: 'Frozen Samosa', category: 'cat_groceries', aliases: ['ready samosa'] },
  { name: 'Ready to Eat', category: 'cat_groceries', aliases: ['mtr', 'haldiram ready meal', 'instant meal'] },

  // ── Meat & Seafood ─────────────────────────────────────────────────────
  { name: 'Chicken', category: 'cat_groceries', aliases: ['murgh', 'murga', 'broiler'] },
  { name: 'Mutton', category: 'cat_groceries', aliases: ['gosht', 'lamb', 'bakra'] },
  { name: 'Fish', category: 'cat_groceries', aliases: ['machli', 'machhi', 'rohu', 'pomfret'] },
  { name: 'Prawns', category: 'cat_groceries', aliases: ['jhinga', 'shrimp'] },
  { name: 'Keema', category: 'cat_groceries', aliases: ['minced meat', 'ground meat'] },

  // ── Bakery ──────────────────────────────────────────────────────────────
  { name: 'Pav', category: 'cat_groceries', aliases: ['bread roll', 'bun'] },
  { name: 'Roti', category: 'cat_groceries', aliases: ['chapati', 'phulka', 'tandoori roti'] },
  { name: 'Naan', category: 'cat_groceries', aliases: ['butter naan', 'garlic naan'] },
  { name: 'Croissant', category: 'cat_groceries', aliases: ['croissants'] },

  // ══════════════════════════════════════════════════════════════════════════
  // FOOD & DINING
  // ══════════════════════════════════════════════════════════════════════════
  { name: 'Restaurant', category: 'cat_food', aliases: ['eating out', 'dine out', 'restaurant bill', 'dinner out', 'lunch out'] },
  { name: 'Snacks', category: 'cat_food', aliases: ['nashta', 'tiffin'] },
  { name: 'Sweets', category: 'cat_food', aliases: ['mithai', 'mishtan', 'sweets box', 'ladoo', 'barfi'] },
  { name: 'Fast Food', category: 'cat_food', aliases: ['burger', 'pizza', 'momos', 'frankie', 'wrap'] },
  { name: 'Street Food', category: 'cat_food', aliases: ['chaat', 'golgappe', 'pani puri', 'samosa', 'vada pav', 'pav bhaji', 'bhel'] },
  { name: 'Biryani', category: 'cat_food', aliases: ['biryani order', 'dum biryani'] },
  { name: 'Thali', category: 'cat_food', aliases: ['lunch thali', 'dinner thali', 'veg thali', 'non veg thali'] },
  { name: 'Dosa', category: 'cat_food', aliases: ['masala dosa', 'south indian'] },
  { name: 'Food Delivery', category: 'cat_food', aliases: ['zomato', 'swiggy', 'online food', 'food order'] },
  { name: 'Cafe', category: 'cat_food', aliases: ['coffee shop', 'starbucks', 'ccd', 'cafe bill'] },
  { name: 'Bakery Item', category: 'cat_food', aliases: ['bakery', 'pastry shop'] },
  { name: 'Alcoholic Drink', category: 'cat_food', aliases: ['beer', 'wine', 'whiskey', 'rum', 'vodka', 'daaru', 'liquor'] },

  // ══════════════════════════════════════════════════════════════════════════
  // TRANSPORT
  // ══════════════════════════════════════════════════════════════════════════
  { name: 'Petrol', category: 'cat_transport', aliases: ['fuel', 'gas', 'gasoline', 'bike fuel', 'car fuel'] },
  { name: 'Diesel', category: 'cat_transport', aliases: ['diesel fuel'] },
  { name: 'CNG', category: 'cat_transport', aliases: ['compressed natural gas'] },
  { name: 'EV Charging', category: 'cat_transport', aliases: ['electric charge', 'ev charge', 'charging'] },
  { name: 'Auto Rickshaw', category: 'cat_transport', aliases: ['auto', 'tuk tuk', 'riksha', 'auto fare'] },
  { name: 'Bus Fare', category: 'cat_transport', aliases: ['bus ticket', 'bus', 'bus pass'] },
  { name: 'Metro Fare', category: 'cat_transport', aliases: ['metro ticket', 'metro', 'metro card', 'metro recharge'] },
  { name: 'Train Fare', category: 'cat_transport', aliases: ['train ticket', 'railway', 'irctc'] },
  { name: 'Cab Fare', category: 'cat_transport', aliases: ['uber', 'ola', 'taxi', 'cab', 'ride'] },
  { name: 'Flight Ticket', category: 'cat_transport', aliases: ['air ticket', 'flight', 'airplane'] },
  { name: 'Parking', category: 'cat_transport', aliases: ['parking fee', 'parking charge'] },
  { name: 'Toll', category: 'cat_transport', aliases: ['toll tax', 'toll booth', 'fastag'] },
  { name: 'Car Service', category: 'cat_transport', aliases: ['car servicing', 'vehicle service', 'bike service'] },
  { name: 'Tyre', category: 'cat_transport', aliases: ['tire', 'puncture', 'tyre change'] },
  { name: 'Car Wash', category: 'cat_transport', aliases: ['bike wash', 'vehicle wash'] },
  { name: 'Vehicle Insurance', category: 'cat_transport', aliases: ['car insurance', 'bike insurance', 'motor insurance'] },

  // ══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ══════════════════════════════════════════════════════════════════════════
  { name: 'Electricity Bill', category: 'cat_utilities', aliases: ['bijli bill', 'light bill', 'power bill', 'electricity'] },
  { name: 'Water Bill', category: 'cat_utilities', aliases: ['paani bill', 'water', 'water charge'] },
  { name: 'Gas Bill', category: 'cat_utilities', aliases: ['gas cylinder', 'lpg', 'cooking gas', 'indane', 'hp gas', 'bharat gas'] },
  { name: 'Internet Bill', category: 'cat_utilities', aliases: ['wifi bill', 'broadband', 'wifi', 'jio fiber', 'airtel fiber'] },
  { name: 'Phone Bill', category: 'cat_utilities', aliases: ['mobile recharge', 'phone recharge', 'recharge', 'prepaid', 'postpaid'] },
  { name: 'DTH Recharge', category: 'cat_utilities', aliases: ['tata sky', 'dish tv', 'airtel dth', 'tv recharge'] },
  { name: 'Rent', category: 'cat_utilities', aliases: ['house rent', 'kiraya', 'room rent', 'flat rent', 'pg rent'] },
  { name: 'Society Maintenance', category: 'cat_utilities', aliases: ['maintenance charge', 'society fees', 'apartment maintenance'] },
  { name: 'Property Tax', category: 'cat_utilities', aliases: ['house tax', 'municipal tax'] },
  { name: 'Water Purifier', category: 'cat_utilities', aliases: ['ro service', 'water filter', 'aquaguard'] },

  // ══════════════════════════════════════════════════════════════════════════
  // HEALTH
  // ══════════════════════════════════════════════════════════════════════════
  { name: 'Medicine', category: 'cat_health', aliases: ['dawa', 'dawai', 'tablets', 'medical', 'pharmacy', 'medical store'] },
  { name: 'Doctor Visit', category: 'cat_health', aliases: ['doctor fee', 'consultation', 'checkup', 'opd'] },
  { name: 'Hospital', category: 'cat_health', aliases: ['hospital bill', 'admission', 'hospital charge'] },
  { name: 'Lab Test', category: 'cat_health', aliases: ['blood test', 'pathology', 'diagnostic', 'test report'] },
  { name: 'Dental', category: 'cat_health', aliases: ['dentist', 'dental checkup', 'tooth'] },
  { name: 'Eye Care', category: 'cat_health', aliases: ['optician', 'eye test', 'spectacles', 'glasses', 'lens', 'contact lens'] },
  { name: 'Gym', category: 'cat_health', aliases: ['gym fee', 'gym membership', 'fitness', 'gym charges'] },
  { name: 'Yoga', category: 'cat_health', aliases: ['yoga class', 'yoga membership'] },
  { name: 'Health Insurance', category: 'cat_health', aliases: ['medical insurance', 'mediclaim'] },
  { name: 'Ayurveda', category: 'cat_health', aliases: ['ayurvedic medicine', 'homeopathy', 'herbal'] },
  { name: 'Vitamins', category: 'cat_health', aliases: ['supplements', 'multivitamin', 'protein powder', 'whey'] },
  { name: 'First Aid', category: 'cat_health', aliases: ['bandage', 'dettol', 'antiseptic'] },
  { name: 'Sanitizer', category: 'cat_health', aliases: ['hand sanitizer'] },
  { name: 'Face Mask', category: 'cat_health', aliases: ['mask', 'n95 mask'] },

  // ══════════════════════════════════════════════════════════════════════════
  // SHOPPING — Household & Personal Care
  // ══════════════════════════════════════════════════════════════════════════
  { name: 'Soap', category: 'cat_shopping', aliases: ['sabun', 'bath soap', 'body wash'] },
  { name: 'Hand Wash', category: 'cat_shopping', aliases: ['liquid hand wash', 'dettol hand wash'] },
  { name: 'Shampoo', category: 'cat_shopping', aliases: ['hair shampoo', 'anti dandruff shampoo'] },
  { name: 'Conditioner', category: 'cat_shopping', aliases: ['hair conditioner'] },
  { name: 'Hair Oil', category: 'cat_shopping', aliases: ['coconut oil for hair', 'parachute', 'hair oil bottle'] },
  { name: 'Toothpaste', category: 'cat_shopping', aliases: ['manjan', 'tooth paste', 'colgate', 'pepsodent'] },
  { name: 'Toothbrush', category: 'cat_shopping', aliases: ['tooth brush', 'electric toothbrush'] },
  { name: 'Mouthwash', category: 'cat_shopping', aliases: ['listerine'] },
  { name: 'Detergent', category: 'cat_shopping', aliases: ['surf', 'washing powder', 'tide', 'rin', 'ariel', 'detergent powder'] },
  { name: 'Liquid Detergent', category: 'cat_shopping', aliases: ['liquid wash', 'fabric wash'] },
  { name: 'Dish Soap', category: 'cat_shopping', aliases: ['bartan soap', 'vim', 'dish wash', 'dish wash bar', 'dish wash liquid'] },
  { name: 'Floor Cleaner', category: 'cat_shopping', aliases: ['lizol', 'phenyl', 'harpic'] },
  { name: 'Toilet Cleaner', category: 'cat_shopping', aliases: ['harpic', 'toilet cleaner liquid'] },
  { name: 'Glass Cleaner', category: 'cat_shopping', aliases: ['colin'] },
  { name: 'Tissue Paper', category: 'cat_shopping', aliases: ['tissues', 'napkins', 'kitchen towel', 'paper towel'] },
  { name: 'Toilet Paper', category: 'cat_shopping', aliases: ['toilet roll'] },
  { name: 'Garbage Bags', category: 'cat_shopping', aliases: ['dustbin bags', 'trash bags'] },
  { name: 'Aluminium Foil', category: 'cat_shopping', aliases: ['aluminum foil', 'foil paper'] },
  { name: 'Cling Wrap', category: 'cat_shopping', aliases: ['food wrap', 'plastic wrap'] },
  { name: 'Sponge', category: 'cat_shopping', aliases: ['scrubber', 'scotch brite'] },
  { name: 'Broom', category: 'cat_shopping', aliases: ['jhadu', 'jhaadu'] },
  { name: 'Mop', category: 'cat_shopping', aliases: ['pocha', 'floor mop'] },
  { name: 'Bucket', category: 'cat_shopping', aliases: ['balti'] },
  { name: 'Dustbin', category: 'cat_shopping', aliases: ['trash can', 'kuda daan'] },
  { name: 'Air Freshener', category: 'cat_shopping', aliases: ['room freshener', 'odonil'] },
  { name: 'Mosquito Repellent', category: 'cat_shopping', aliases: ['good knight', 'all out', 'mosquito coil', 'hit'] },
  { name: 'Insecticide', category: 'cat_shopping', aliases: ['cockroach killer', 'bug spray', 'pest control'] },
  { name: 'Deodorant', category: 'cat_shopping', aliases: ['deo', 'body spray', 'perfume'] },
  { name: 'Face Wash', category: 'cat_shopping', aliases: ['face cleanser'] },
  { name: 'Moisturizer', category: 'cat_shopping', aliases: ['body lotion', 'cream', 'nivea'] },
  { name: 'Sunscreen', category: 'cat_shopping', aliases: ['sun cream', 'spf'] },
  { name: 'Razor', category: 'cat_shopping', aliases: ['shaving razor', 'blade', 'gillette'] },
  { name: 'Shaving Cream', category: 'cat_shopping', aliases: ['shaving foam', 'after shave'] },
  { name: 'Sanitary Pads', category: 'cat_shopping', aliases: ['pads', 'sanitary napkin', 'whisper', 'stayfree'] },
  { name: 'Diapers', category: 'cat_shopping', aliases: ['pampers', 'baby diaper', 'nappy'] },
  { name: 'Baby Food', category: 'cat_shopping', aliases: ['cerelac', 'baby formula'] },
  { name: 'Cotton', category: 'cat_shopping', aliases: ['cotton balls', 'cotton roll'] },
  { name: 'Candles', category: 'cat_shopping', aliases: ['mombatti'] },
  { name: 'Batteries', category: 'cat_shopping', aliases: ['cell', 'duracell', 'eveready'] },
  { name: 'Light Bulb', category: 'cat_shopping', aliases: ['led bulb', 'tubelight', 'cfl'] },
  { name: 'Extension Cord', category: 'cat_shopping', aliases: ['power strip', 'plug'] },
  { name: 'Umbrella', category: 'cat_shopping', aliases: ['chhatri'] },
  { name: 'Clothing', category: 'cat_shopping', aliases: ['kapde', 'clothes', 'shirt', 'pant', 'jeans', 'dress', 'kurti', 'saree'] },
  { name: 'Footwear', category: 'cat_shopping', aliases: ['shoes', 'chappal', 'sandals', 'slippers', 'sneakers'] },
  { name: 'Bag', category: 'cat_shopping', aliases: ['backpack', 'handbag', 'school bag', 'laptop bag'] },

  // ══════════════════════════════════════════════════════════════════════════
  // ENTERTAINMENT
  // ══════════════════════════════════════════════════════════════════════════
  { name: 'Movie', category: 'cat_entertainment', aliases: ['cinema', 'film', 'movie ticket', 'pvr', 'inox'] },
  { name: 'Netflix', category: 'cat_entertainment', aliases: ['netflix subscription'] },
  { name: 'Amazon Prime', category: 'cat_entertainment', aliases: ['prime video', 'prime subscription'] },
  { name: 'Spotify', category: 'cat_entertainment', aliases: ['spotify subscription', 'music subscription'] },
  { name: 'YouTube Premium', category: 'cat_entertainment', aliases: ['youtube subscription'] },
  { name: 'Hotstar', category: 'cat_entertainment', aliases: ['disney hotstar', 'hotstar subscription'] },
  { name: 'Gaming', category: 'cat_entertainment', aliases: ['video game', 'game purchase', 'playstation', 'xbox'] },
  { name: 'Concert', category: 'cat_entertainment', aliases: ['event ticket', 'show ticket', 'live show'] },
  { name: 'Amusement Park', category: 'cat_entertainment', aliases: ['theme park', 'water park'] },
  { name: 'Newspaper', category: 'cat_entertainment', aliases: ['akhbar', 'paper'] },
  { name: 'Magazine', category: 'cat_entertainment', aliases: ['magazine subscription'] },

  // ══════════════════════════════════════════════════════════════════════════
  // EDUCATION
  // ══════════════════════════════════════════════════════════════════════════
  { name: 'School Fee', category: 'cat_education', aliases: ['school fees', 'tuition fee', 'school charge'] },
  { name: 'College Fee', category: 'cat_education', aliases: ['university fee', 'semester fee'] },
  { name: 'Coaching Fee', category: 'cat_education', aliases: ['tuition', 'coaching', 'classes', 'coaching class'] },
  { name: 'Books', category: 'cat_education', aliases: ['kitab', 'textbook', 'novel'] },
  { name: 'Stationery', category: 'cat_education', aliases: ['notebook', 'pen', 'pencil', 'eraser', 'ruler'] },
  { name: 'Online Course', category: 'cat_education', aliases: ['udemy', 'coursera', 'online class', 'skill course'] },
  { name: 'Exam Fee', category: 'cat_education', aliases: ['exam fees', 'registration fee', 'form fee'] },
  { name: 'Printer Paper', category: 'cat_education', aliases: ['a4 paper', 'print paper', 'xerox paper'] },
  { name: 'Printing', category: 'cat_education', aliases: ['xerox', 'photocopy', 'print out'] },
  { name: 'Laptop', category: 'cat_education', aliases: ['computer', 'macbook', 'notebook pc'] },
  { name: 'Software', category: 'cat_education', aliases: ['app subscription', 'saas', 'tool'] },

  // ══════════════════════════════════════════════════════════════════════════
  // OTHER
  // ══════════════════════════════════════════════════════════════════════════
  { name: 'Charity', category: 'cat_other', aliases: ['donation', 'daan', 'charity donation'] },
  { name: 'Temple', category: 'cat_other', aliases: ['mandir', 'gurudwara', 'mosque', 'church', 'religious'] },
  { name: 'Gift', category: 'cat_other', aliases: ['gift purchase', 'birthday gift', 'wedding gift', 'tohfa'] },
  { name: 'Salon', category: 'cat_other', aliases: ['haircut', 'parlour', 'parlor', 'barber', 'nai'] },
  { name: 'Laundry', category: 'cat_other', aliases: ['dry cleaning', 'dhobi', 'ironing', 'pressing'] },
  { name: 'Pet Food', category: 'cat_other', aliases: ['dog food', 'cat food', 'pet care'] },
  { name: 'Vet', category: 'cat_other', aliases: ['vet bill', 'veterinary', 'animal doctor'] },
  { name: 'Travel', category: 'cat_other', aliases: ['trip', 'vacation', 'holiday', 'tour'] },
  { name: 'Hotel', category: 'cat_other', aliases: ['hotel room', 'hotel booking', 'lodge', 'stay'] },
  { name: 'Courier', category: 'cat_other', aliases: ['delivery charge', 'shipping', 'postage', 'speed post'] },
  { name: 'ATM Fee', category: 'cat_other', aliases: ['atm charge', 'bank charge'] },
  { name: 'EMI', category: 'cat_other', aliases: ['loan emi', 'installment', 'emi payment'] },
  { name: 'Credit Card Bill', category: 'cat_other', aliases: ['cc bill', 'card payment'] },
  { name: 'Fine', category: 'cat_other', aliases: ['challan', 'traffic fine', 'penalty'] },
  { name: 'Legal Fee', category: 'cat_other', aliases: ['lawyer', 'advocate', 'stamp paper', 'notary'] },
  { name: 'Passport', category: 'cat_other', aliases: ['passport fee', 'visa fee'] },
  { name: 'Aadhar', category: 'cat_other', aliases: ['aadhar card', 'id card'] },
  { name: 'Home Repair', category: 'cat_other', aliases: ['plumber', 'electrician', 'carpenter', 'repair', 'maintenance'] },
  { name: 'Furniture', category: 'cat_other', aliases: ['table', 'chair', 'sofa', 'bed', 'almirah', 'wardrobe'] },
  { name: 'Electronics', category: 'cat_other', aliases: ['mobile phone', 'phone', 'earphone', 'charger', 'cable', 'adapter'] },
  { name: 'Kitchen Appliance', category: 'cat_other', aliases: ['mixer', 'grinder', 'pressure cooker', 'microwave', 'toaster', 'induction'] },
  { name: 'Fan', category: 'cat_other', aliases: ['ceiling fan', 'table fan', 'cooler'] },
  { name: 'AC Service', category: 'cat_other', aliases: ['ac repair', 'ac maintenance', 'air conditioner'] },
  { name: 'Washing Machine', category: 'cat_other', aliases: ['washer', 'washing machine repair'] },
  { name: 'Refrigerator', category: 'cat_other', aliases: ['fridge', 'fridge repair'] },
  { name: 'Paint', category: 'cat_other', aliases: ['wall paint', 'house painting'] },
  { name: 'Gardening', category: 'cat_other', aliases: ['plant', 'pot', 'seeds', 'manure', 'garden'] },
  { name: 'Key Copy', category: 'cat_other', aliases: ['duplicate key', 'locksmith'] },
  { name: 'Photocopy', category: 'cat_other', aliases: ['xerox', 'lamination'] },
  { name: 'Tailor', category: 'cat_other', aliases: ['stitching', 'alteration', 'darzi'] },
  { name: 'Tips', category: 'cat_other', aliases: ['tip', 'bakshish'] },
  { name: 'Miscellaneous', category: 'cat_other', aliases: ['misc', 'other expense', 'sundry'] },
];

/**
 * Generate SQL seed statements for canonical items.
 * Uses subquery to handle existing canonical items gracefully.
 */
export function generateSeedSQL(): string {
  const statements: string[] = [];

  for (const item of SEED_ITEMS) {
    const id = `seed_${item.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const name = item.name.replace(/'/g, "''");

    // Insert canonical item only if name doesn't exist
    statements.push(
      `INSERT OR IGNORE INTO canonical_items (id, name, category_id, vector_id) SELECT '${id}', '${name}', '${item.category}', '${id}' WHERE NOT EXISTS (SELECT 1 FROM canonical_items WHERE name = '${name}');`,
    );

    // Insert self-alias
    statements.push(
      `INSERT OR IGNORE INTO aliases (id, raw_name, canonical_id, confidence) SELECT 'a_${id}', '${name.toLowerCase()}', c.id, 1.0 FROM canonical_items c WHERE c.name = '${name}';`,
    );

    // Insert each alias
    for (let i = 0; i < item.aliases.length; i++) {
      const alias = item.aliases[i].replace(/'/g, "''").toLowerCase();
      const aliasId = `a_${id}_${i}`;
      statements.push(
        `INSERT OR IGNORE INTO aliases (id, raw_name, canonical_id, confidence) SELECT '${aliasId}', '${alias}', c.id, 1.0 FROM canonical_items c WHERE c.name = '${name}';`,
      );
    }
  }

  return statements.join('\n');
}

if (typeof process !== 'undefined') {
  console.log(generateSeedSQL());
}
