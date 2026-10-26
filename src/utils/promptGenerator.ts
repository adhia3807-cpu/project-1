/**
 * Ultra-Detailed Dynamic Product Research Prompt Generator
 *
 * Generates comprehensive, type-specific research and analysis prompts for
 * external AI models (ChatGPT, Gemini, Claude).
 *
 * Purpose: Instructs the external AI to act as a product knowledge analyst,
 * research all customer-relevant information, and produce a complete, factual,
 * high-density knowledge document to populate the autonomous AI Kiosk database.
 */

export interface PromptGeneratorResult {
  prompt: string;
  isValid: boolean;
  warning?: string;
  effectiveType: string;
}

export function generateAiDescriptionPrompt(
  productName: string,
  productType: string,
  customType?: string
): PromptGeneratorResult {
  const trimmedName = productName?.trim() || '';
  const trimmedType = productType?.trim() || '';

  if (!trimmedName) {
    return {
      prompt: '',
      isValid: false,
      warning: 'Enter the product name to generate the research prompt.',
      effectiveType: trimmedType || 'General Product',
    };
  }

  if (!trimmedType) {
    return {
      prompt: '',
      isValid: false,
      warning: 'Select a product type to generate a specialized research prompt.',
      effectiveType: 'General Product',
    };
  }

  const effectiveType =
    trimmedType === 'Other / Custom' && customType?.trim()
      ? customType.trim()
      : trimmedType;

  // Build the deep, product-type specific research framework
  const categoryFramework = getCategoryResearchFramework(trimmedName, trimmedType, effectiveType);

  const fullPrompt = `You are an expert product research analyst and product knowledge architect.

Perform a deep, comprehensive factual research and information analysis for:

PRODUCT NAME: "${trimmedName}"
PRODUCT CATEGORY: "${effectiveType}"

================================================================================
CRITICAL DIRECTIVE & PURPOSE
================================================================================
The purpose of this research is NOT to write a short promotional marketing pitch or advertisement.
The purpose is to create a COMPLETE, FACTUAL PRODUCT KNOWLEDGE DOCUMENT containing every piece of useful, accurate, customer-relevant information that a real customer could reasonably ask before or after purchasing, using, or choosing this product.

This document will be analyzed by another AI system and converted into an autonomous structured product knowledge database to answer customer questions in real time.

Therefore, your output must be information-dense, structured, thoroughly detailed, and 100% factual.

================================================================================
RESEARCH INSTRUCTIONS & INFORMATION LEVELS
================================================================================

${categoryFramework}

================================================================================
STRICT RESEARCH & ANTI-HALLUCINATION RULES
================================================================================
1. NEVER INVENT INFORMATION: Never fabricate prices, specifications, ingredients, courses, fees, mileage, warranty periods, contact numbers, certifications, or performance numbers.
2. MISSING INFORMATION: If any detail is unavailable in public official sources or cannot be verified, explicitly write:
   "Not available" or "Not specified in available official documentation." Do NOT guess or extrapolate.
3. CONFLICTING SOURCES: If different reliable sources provide conflicting details (e.g. across different regions or model years), clearly note the variance.
4. NO MARKETING HYPE: Avoid empty promotional buzzwords ("revolutionary", "best in the world", "unmatched") unless citing official verified awards.
5. NO DUPLICATION: Keep the document clean, organized, and dense without repetitive filler.
6. TERMINOLOGY CLARITY: Use standard technical, dimensional, and commercial terminology so downstream AI systems can index the data cleanly.

================================================================================
FINAL OUTPUT FORMAT
================================================================================
Output the complete product research document using clean, logical headings, structured bullet points, and natural explanatory paragraphs. Ensure all relevant questions from the framework above are directly answered.`;

  return {
    prompt: fullPrompt,
    isValid: true,
    effectiveType,
  };
}

/**
 * Generates category-specific deep research directives and customer question simulations
 */
function getCategoryResearchFramework(
  productName: string,
  productType: string,
  effectiveType: string
): string {
  switch (productType) {
    case 'Food & Beverage':
      return `LEVEL 1 — PRODUCT IDENTITY & ORIGIN
• Official product name, brand name, parent company/manufacturer, place of origin.
• Product classification (Beverage, carbonated drink, dairy, snack, health food, ready-to-eat).
• Brand history, manufacturing standards, certifications (FSSAI, ISO, HACCP, FDA where applicable).

LEVEL 2 — INGREDIENTS, FLAVOUR & TASTE PROFILE
• Primary ingredients list, active flavoring agents, sweeteners (natural sugar vs artificial sweeteners).
• Taste profile (Sweet, citrusy, tangy, fizzy, spicy, creamy), carbonation level, color, aroma.
• 100% Vegetarian / Non-Vegetarian classification (Green vegetarian logo indicator, Vegan, Halal).
• Allergen declarations (Milk/dairy, gluten, nuts, soy, caffeine content, preservatives, artificial colors).

LEVEL 3 — SIZES, VOLUMES, PACKAGING & VARIANTS
• Available packaging formats (Cans, PET bottles, glass bottles, tetra packs, sachets, multipacks).
• Exact volume / weight variants (e.g., 200ml, 250ml slim can, 500ml, 600ml, 750ml, 1.25L, 1.75L, 2L, 2.25L, 50g, 100g, 500g, 1kg).
• Flavor variants & alternative editions (Diet / Zero Sugar, Lime, Berry, etc.).

LEVEL 4 — NUTRITIONAL VALUES (Per 100ml / 100g & Per Serving)
• Energy / Calories (kcal), Carbohydrates (g), Total Sugars (g), Added Sugars (g).
• Protein (g), Total Fat (g), Saturated Fat (g), Sodium (mg), Dietary Fiber (g), Vitamins & Minerals.

LEVEL 5 — PRICING, MRP & PURCHASE INFORMATION
• MRP (Maximum Retail Price) for each individual size/pack variant in Indian Rupees (₹).
• Multi-pack discounts, combo offers, festival promotional pricing if known.
• Important note: Clearly state that retail prices may vary with location or offers.

LEVEL 6 — STORAGE, SHELF LIFE, SERVING & USAGE
• Shelf life / Best before duration from date of manufacture.
• Storage instructions (Store in cool, dry place away from direct sunlight, refrigerate after opening).
• Ideal serving recommendations (Serve chilled, shake well, mix with ice, meal pairings).

LEVEL 7 — AVAILABILITY & CONTACT DETAILS
• Availability channels (Supermarkets, local kirana stores, quick commerce like Blinkit/Zepto/Instamart, online retail).
• Manufacturer corporate address, customer care helpline, email, official website.

LEVEL 8 — CUSTOMER QUESTIONS THIS RESEARCH MUST DIRECTLY ANSWER
- "What ingredients and flavours are in ${productName}?"
- "What is the price of the 250ml can, 500ml bottle, and 1.25L pack?"
- "How much sugar and how many calories are in 100ml of ${productName}?"
- "Is it 100% vegetarian / vegan / gluten-free?"
- "Does it contain caffeine or artificial sweeteners?"
- "What is the shelf life and how should I store it after opening?"
- "Who manufactures ${productName} and where is it available?"`;

    case 'College / Education':
    case 'Training / Coaching':
      return `LEVEL 1 — INSTITUTION IDENTITY & ACCREDITATION
• Official institution name, parent trust/educational foundation, year of establishment.
• Institution type (Central/State University, Autonomous, Government-aided, Private Institution).
• Accreditations, Affiliations & Rankings (NAAC grade, NIRF rank, UGC recognition, AICTE / NBA approvals).
• Campus location, full postal address, city, district, state, pin code, nearest railway/airport transport connectivity.

LEVEL 2 — ACADEMIC PROGRAMS & DEPARTMENTS
• Complete list of undergraduate (UG), postgraduate (PG), diploma, doctoral (PhD) programs.
• Academic departments, specialized streams (e.g. Computer Science, AI & ML, Mechanical, Management, Commerce).
• Course durations (e.g. 4 years for B.Tech, 2 years for MBA/M.Tech, 3 years for B.Sc/B.Com).
• Seat intake capacity per course, curriculum structure, semester system.

LEVEL 3 — ELIGIBILITY CRITERIA & ADMISSION PROCESS
• Academic eligibility requirements (Minimum percentage in 10+2 / Graduation, mandatory subject combinations).
• Entrance examinations accepted (e.g., KEAM, JEE Main, NEET, CAT, GATE, CMAT, institutional entrance tests).
• Admission quotas (Merit seats, Management quota, NRI quota, reservation categories).
• Application process, key admission cycle dates, online application portal link.

LEVEL 4 — FEE STRUCTURE, SCHOLARSHIPS & FINANCIAL AID
• Annual tuition fees, semester fees, one-time admission charges, caution deposits in Indian Rupees (₹).
• Hostel accommodation charges (AC / Non-AC room rates), mess food fees, transportation bus fees.
• Merit scholarships, sports scholarships, fee concessions for economically backward or minority categories.
• Education loan tie-ups with leading banks.

LEVEL 5 — CAMPUS INFRASTRUCTURE & STUDENT FACILITIES
• Academic facilities: Smart classrooms, high-end laboratories, central digital library, research centers.
• Residential facilities: Boys' and Girls' hostels, room amenities, food quality, security, curfew guidelines.
• Campus life: Sports complexes, indoor stadium, gym, cafeteria, healthcare center, Wi-Fi connectivity, cultural clubs.

LEVEL 6 — PLACEMENT RECORD & INDUSTRY CONNECTIONS
• Placement statistics: Highest salary package, average CTC, overall placement percentage.
• Major recruiting companies and top employers visiting campus.
• Internship opportunities, training programs, industry tie-ups, alumni network.

LEVEL 7 — CONTACT, HELPLINE & ADMISSIONS DESK
• Admissions office phone numbers, WhatsApp helpline, official email IDs.
• Official website URL, online inquiry/application form links, visitor timings.

LEVEL 8 — CUSTOMER / PROSPECTIVE STUDENT QUESTIONS TO ANSWER
- "What courses and specializations are offered at ${productName}?"
- "What is the fee structure for B.Tech / MBA / degree programs?"
- "What is the eligibility criteria and which entrance exams are required?"
- "Are hostel facilities available for boys and girls, and what are the fees?"
- "What was the highest and average placement package last year?"
- "Which university is ${productName} affiliated to, and what is its NAAC grade?"
- "How do I apply and who do I contact for admissions?"`;

    case 'Computer / Laptop':
      return `LEVEL 1 — PRODUCT IDENTITY & POSITIONING
• Exact brand, series, model name, SKU / part number, launch year.
• Target persona & use cases (Coding / Programming, Gaming, 4K Video Editing, Business/Office, Student).

LEVEL 2 — PROCESSOR, PERFORMANCE & COOLING
• CPU: Make (Intel Core / AMD Ryzen / Apple Silicon), generation, exact model (e.g., i7-13700H, Ryzen 7 7840HS).
• CPU specifications: Total cores (Performance + Efficiency cores), threads, base clock, max boost clock (GHz), cache (MB).
• Thermal design & cooling system (Dual fans, vapor chamber, liquid metal, exhaust vents).

LEVEL 3 — MEMORY & STORAGE (RAM & SSD)
• RAM: Capacity (8GB, 16GB, 32GB), RAM type (DDR4, DDR5, LPDDR5X), clock speed (MHz).
• Upgradeability: Number of SODIMM slots, maximum expandable memory limit (or soldered).
• Storage: SSD capacity (512GB, 1TB, 2TB), interface (PCIe Gen 3/4/5 NVMe M.2), extra M.2 expansion slots.

LEVEL 4 — GRAPHICS & VISUAL CAPABILITIES
• GPU: Integrated Graphics vs Dedicated Graphics (NVIDIA GeForce RTX 4050/4060/4070, AMD Radeon).
• GPU specifications: Dedicated VRAM (GB GDDR6), Maximum Graphics Power (TGP in Watts), Ray Tracing, DLSS support.

LEVEL 5 — DISPLAY SPECIFICATIONS
• Screen size (inches, e.g., 14", 15.6", 16"), aspect ratio (16:9 or 16:10), panel technology (IPS, OLED, Mini-LED).
• Resolution (FHD 1920x1080, QHD 2560x1440, 4K), refresh rate (60Hz, 120Hz, 144Hz, 165Hz, 240Hz).
• Brightness (nits), color gamut coverage (100% sRGB, 100% DCI-P3), anti-glare finish, eye-care certification.

LEVEL 6 — BATTERY, CHARGING & PORTABILITY
• Battery capacity (Watt-hours / Whr), estimated real-world battery life (hours for web/productivity).
• Charging: Power adapter wattage, fast charging capabilities (0-50% in minutes), Type-C USB-PD charging support.
• Portability: Weight in kilograms (kg), chassis thickness (mm), body build materials (Aluminum, Magnesium alloy, Polycarbonate).

LEVEL 7 — PORTS, CONNECTIVITY & MULTIMEDIA
• I/O Ports: Thunderbolt 4 / USB4, USB 3.2 Gen 2 Type-C, USB-A ports, HDMI 2.1, RJ-45 Ethernet, SD card reader, 3.5mm audio jack.
• Wireless: Wi-Fi 6 / 6E / 7, Bluetooth version.
• Keyboard & Trackpad: Backlit (White / RGB per-key), key travel (mm), numeric keypad presence, precision glass trackpad.
• Webcam & Audio: Webcam resolution (720p / 1080p FHD) with privacy shutter, built-in dual microphones, stereo speaker setup.

LEVEL 8 — OPERATING SYSTEM, WARRANTY & PRICING
• Pre-installed OS (Windows 11 Home/Pro, macOS, Linux), bundled software (MS Office lifetime license).
• Warranty duration (1 Year / 2 Years / 3 Years), warranty type (Onsite vs Carry-in, Accidental Damage Protection).
• Current retail pricing / MRP in Indian Rupees (₹), variant price differences.

LEVEL 9 — CUSTOMER QUESTIONS THIS RESEARCH MUST ANSWER
- "Is ${productName} good for programming, gaming, and video editing?"
- "What is the exact processor, RAM, and SSD storage capacity?"
- "Can the RAM and SSD be upgraded in the future?"
- "What is the battery backup and does it support USB Type-C charging?"
- "What is the display resolution, refresh rate, and brightness in nits?"
- "What is the exact weight and what ports are available?"
- "What is the warranty period and what is included in the box?"`;

    case 'Mobile / Smartphone':
      return `LEVEL 1 — PRODUCT IDENTITY & POSITIONING
• Exact brand name, model name, series, variant configurations (e.g., 8GB+128GB, 12GB+256GB, 16GB+512GB).
• Target market segment (Budget, Mid-range, Flagship Killer, Premium Flagship).

LEVEL 2 — DISPLAY SPECIFICATIONS
• Screen size (inches, diagonal), display panel type (AMOLED, Super AMOLED, LTPO OLED, IPS LCD).
• Resolution (FHD+ 1080x2400, 1.5K, 2K QHD+), pixel density (PPI).
• Refresh rate (60Hz, 90Hz, 120Hz, 144Hz adaptive refresh rate), touch sampling rate (Hz).
• Peak brightness in nits (Outdoor brightness, HDR peak), HDR10+ / Dolby Vision certifications.
• Screen protection (Corning Gorilla Glass Victus / Victus 2 / Ceramic Shield).

LEVEL 3 — PROCESSOR, SOFTWARE & MEMORY
• Chipset: SoC make and model (Qualcomm Snapdragon, MediaTek Dimensity, Apple A-series), fabrication process (nm).
• GPU, AnTuTu / Geekbench benchmark tier.
• RAM type (LPDDR4X, LPDDR5, LPDDR5X), Virtual RAM expansion feature.
• Storage type (UFS 2.2, UFS 3.1, UFS 4.0), MicroSD card slot support (Dedicated vs Hybrid vs None).
• OS: Pre-installed version (Android 14/15, iOS), custom UI skin, guaranteed OS updates & security patch timeline.

LEVEL 4 — CAMERA SYSTEM & VIDEO RECORDING
• Rear Camera Setup: Primary camera megapixels (MP), sensor model, aperture (f/stop), Optical Image Stabilization (OIS).
• Secondary Cameras: Ultra-wide lens (MP, field of view), Telephoto / Periscope zoom lens (Optical zoom factor 2x/3x/5x), Macro lens.
• Video Recording: 4K @ 30/60fps, 8K video, Slow-motion capabilities, Gyro-EIS, Cinematic video mode.
• Front Selfie Camera: Megapixels (MP), aperture, video recording resolution.

LEVEL 5 — BATTERY, CHARGING & THERMALS
• Battery capacity in milliampere-hours (mAh).
• Wired charging speed in Watts (W), estimated 0-100% charging time in minutes.
• Wireless charging (Watts) & Reverse wireless charging capabilities.
• In-box contents: Clarify if charger adapter is included in the retail box or sold separately.

LEVEL 6 — CONNECTIVITY, DURABILITY & SENSORS
• Network: 5G support (List of supported 5G bands), 4G VoLTE, Dual SIM (Dual nano-SIM / eSIM).
• Wireless: Wi-Fi 6 / 6E / 7, Bluetooth version, NFC, GPS / NavIC satellite support, IR Blaster.
• Durability: IP rating for dust and water resistance (IP68, IP67, IP54), drop resistance.
• Biometrics & Audio: In-display fingerprint (Optical / Ultrasonic) vs Side-mounted, Face unlock, Stereo speakers with Dolby Atmos, 3.5mm headphone jack presence.
• Dimensions (Height, Width, Depth in mm) and Weight in grams (g).

LEVEL 7 — PRICING & COLOR OPTIONS
• Available color variants (official shade names).
• Official MRP and current launch/selling price for each RAM+Storage variant in Indian Rupees (₹).
• Standard warranty coverage (1 Year phone, 6 months in-box accessories).

LEVEL 8 — CUSTOMER QUESTIONS THIS RESEARCH MUST ANSWER
- "What are the camera specifications and does it have OIS for blur-free photos?"
- "What is the battery size and how fast does it charge?"
- "Is the charger adapter included inside the retail box?"
- "Does it support 5G and what are the available storage/RAM variants?"
- "What is the screen refresh rate and is it an AMOLED display?"
- "Is it waterproof or water-resistant (what is the IP rating)?"
- "What is the price of each variant and what colors are available?"`;

    case 'Automobile':
      return `LEVEL 1 — VEHICLE IDENTITY & VARIANTS
• Manufacturer brand, model name, segment (Hatchback, Compact SUV, Mid-size SUV, Sedan, EV, Cruiser bike).
• Complete list of trim levels / variants (e.g. Base, Mid, Top-spec, Dual-tone editions).

LEVEL 2 — ENGINE, PERFORMANCE & TRANSMISSION
• Engine displacement (cc / Litres), cylinders, fuel options (Petrol, Diesel, CNG, Strong Hybrid, All-Electric EV).
• Power output (BHP / PS @ RPM), peak torque (Nm @ RPM).
• Transmission options (5-Speed / 6-Speed Manual, AMT, Torque Converter AT, CVT, Dual-Clutch DCT/DSG).
• Drivetrain: Front-Wheel Drive (FWD), Rear-Wheel Drive (RWD), All-Wheel Drive (AWD), 4x4 with low-range.
• EV Specifics (if applicable): Battery pack capacity (kWh), electric motor power/torque, drive range (km per full charge), AC standard vs DC fast-charging duration (10% to 80%).

LEVEL 3 — FUEL EFFICIENCY & REAL-WORLD MILEAGE
• ARAI certified fuel economy (km/litre or km/kg for CNG).
• Real-world estimated city mileage and highway mileage.
• Fuel tank capacity in litres.

LEVEL 4 — DIMENSIONS, CAPACITY & GROUND CLEARANCE
• Dimensions: Overall length, width, height, wheelbase (mm).
• Unladen Ground Clearance (mm) — crucial for Indian roads and speed breakers.
• Boot space capacity (Litres), seating capacity (5-seater / 7-seater configurations).
• Kerb weight and gross vehicle weight (kg).

LEVEL 5 — SAFETY RATINGS & DRIVER ASSISTANCE (ADAS)
• Global NCAP / Bharat NCAP crash test rating (Star rating & adult/child protection scores).
• Standard safety equipment: Airbag count (e.g. 6 airbags standard), ABS with EBD, Electronic Stability Program (ESP).
• Hill Hold Assist, Hill Descent Control, Traction Control, ISOFIX child seat anchor points, Tyre Pressure Monitoring System (TPMS).
• ADAS Level 1 / Level 2 features (Adaptive Cruise Control, Lane Keep Assist, Autonomous Emergency Braking, Blind Spot Monitor, 360-degree camera).

LEVEL 6 — CABIN COMFORT, TECH & INFOTAINMENT
• Touchscreen size (inches), Android Auto & Apple CarPlay (Wired / Wireless), connected car technology features.
• Sound system brand & speaker count (e.g. Bose, JBL, Harman).
• Luxury features: Panoramic / electric sunroof, ventilated front seats, automatic climate control with rear AC vents, digital instrument cluster, ambient lighting, wireless phone charger.

LEVEL 7 — PRICING, WARRANTY & MAINTENANCE
• Ex-showroom price range in Indian Rupees (₹) across base to top variants.
• Approximate on-road price estimates, road tax (RTO), and insurance costs.
• Standard manufacturer warranty (Years / Kilometres), extended warranty options.
• Service intervals, estimated annual maintenance cost, roadside assistance.

LEVEL 8 — CUSTOMER QUESTIONS THIS RESEARCH MUST ANSWER
- "What is the mileage of petrol vs diesel / CNG variants?"
- "What is the ex-showroom and on-road price range in India?"
- "How many airbags and what is the Bharat NCAP / Global NCAP safety rating?"
- "What is the ground clearance in mm and boot space in litres?"
- "What features are included in the top-end variant (sunroof, 360 camera, ADAS)?"
- "What is the warranty coverage and typical service cost?"`;

    case 'Hotel / Resort':
      return `LEVEL 1 — PROPERTY IDENTITY & LOCATION
• Official hotel/resort name, star classification (3-Star, 4-Star, 5-Star Luxury, Heritage Property, Eco-Resort).
• Exact physical location, full postal address, landmark, nearby natural attractions (beach, hills, backwaters).
• Proximity to transit hubs: Distance from nearest airport (km), railway station, and bus terminal.

LEVEL 2 — ACCOMMODATION & ROOM TYPES
• Available room categories (Standard, Deluxe, Executive Suite, Family Room, Private Pool Villa, Honeymoon Suite).
• Room dimensions (sq ft / sq m), bed configuration (King, Twin, Queen).
• Max guest occupancy per room (Adults + Children rules, extra bed availability and charges).
• In-room amenities: Air conditioning, high-speed Wi-Fi, Smart TV, minibar, tea/coffee maker, safe, balcony views (Sea view, Mountain view, Garden view).

LEVEL 3 — DINING & RESTAURANTS
• On-site dining venues (Multi-cuisine restaurant, specialty restaurant, cafe, poolside bar).
• Meal plans available: European Plan (Room only), Continental Plan (Complimentary breakfast), Modified American Plan (Breakfast + Lunch/Dinner).
• Cuisine options: Authentic Indian, regional specialties (e.g. Kerala sadhya/seafood), Continental, Oriental, Jain food, Halal food availability.
• 24/7 Room service availability and menu options.

LEVEL 4 — RECREATIONAL & WELLNESS FACILITIES
• Swimming pool (Infinity pool, temperature-controlled, separate kids pool).
• Spa & Wellness: Ayurvedic massage packages, wellness therapy, steam room, sauna, jacuzzi.
• Fitness & Sports: Gymnasium, indoor games (billiards, table tennis), outdoor sports (tennis, badminton, cycling, kayaking).
• Children's play area, kids club, babysitting services.

LEVEL 5 — EVENTS, BANQUETING & WEDDINGS
• Banquet hall capacities, outdoor lawn venues, conference halls, boardroom facilities.
• Destination wedding packages, audio-visual equipment, event catering services.

LEVEL 6 — TARIFFS, POLICIES & BOOKING DETAILS
• Room tariff range per night in Indian Rupees (₹), seasonal peak rates vs off-peak discounts.
• Check-in time (e.g. 2:00 PM) and Check-out time (e.g. 11:00 AM).
• Early check-in and late check-out policies and surcharges.
• Cancellation and refund policy, advance booking deposit requirements.
• Pet policy (Pet-friendly rooms or strictly no pets).
• Official reservation telephone numbers, WhatsApp booking desk, email, booking website.

LEVEL 7 — CUSTOMER QUESTIONS THIS RESEARCH MUST ANSWER
- "What is the room tariff per night and what room types are available?"
- "What are the check-in and check-out timings?"
- "Is breakfast included in the booking?"
- "Do you have a swimming pool, spa, and fitness centre?"
- "How far is the property from the airport or railway station?"
- "What is the cancellation policy and are pets allowed?"
- "How can I contact the hotel directly for room reservations?"`;

    case 'Restaurant / Cafe':
      return `LEVEL 1 — IDENTITY, CUISINE & AMBIANCE
• Restaurant / Cafe name, dining concept (Casual Dining, Fine Dining, Quick Service Restaurant, Bakery & Cafe, Rooftop Lounge).
• Specialty cuisines served (e.g., South Indian, North Indian, Arabian, Chinese, Italian, Continental, Mughlai).
• Ambiance, seating capacity, family dining sections, private dining rooms (PDR).

LEVEL 2 — LOCATION, TIMINGS & OPERATIONS
• Full physical address, landmark, area/locality, city, pin code.
• Operating hours: Lunch hours, dinner hours, weekend timings, weekly off days.
• Parking facilities: Dedicated parking lot, valet parking availability, street parking.

LEVEL 3 — MENU, SIGNATURE DISHES & SPECIALTIES
• Signature must-try dishes, chef's specials, best-selling starters, main courses, and desserts.
• Special combos, lunch thalis, platters, buffet spreads (weekend vs weekday buffet prices).
• Beverage menu: Specialty coffees, mocktails, fresh fruit juices, shakes, traditional drinks.

LEVEL 4 — DIETARY COMPLIANCE & INGREDIENT STANDARDS
• Classification: 100% Pure Vegetarian vs Multi-Cuisine with Non-Veg.
• Meat certifications: Halal certified meat, fresh seafood sourcing.
• Special diets: Vegan options, Jain food preparation (no onion/garlic), gluten-free options, allergen details.

LEVEL 5 — PRICING & PORTION SIZES
• Average cost for two people in Indian Rupees (₹).
• Price range for main dishes, appetizers, and beverages.
• Portion sizes (Single portion, full portion, serves 2-3 people).

LEVEL 6 — SERVICES, RESERVATION & ONLINE ORDERING
• Table reservation policy (Walk-in only vs Advance booking via phone/Zomato/Swiggy).
• Dine-in, Takeaway / Parcel counter service.
• Home delivery coverage area, online ordering partners (Swiggy, Zomato, Direct delivery).
• Accepted payment methods: UPI (Google Pay, PhonePe, Paytm), Credit/Debit cards, Cash.
• Contact phone numbers, WhatsApp for orders, social media pages.

LEVEL 7 — CUSTOMER QUESTIONS THIS RESEARCH MUST ANSWER
- "What are your signature dishes and best-selling menu items?"
- "What is the average cost for two people?"
- "Is the meat 100% Halal / Do you have Pure Veg or Jain options?"
- "What are your opening and closing timings?"
- "Do you have car parking and valet service?"
- "Do you take advance table reservations and how can I book?"
- "Do you offer home delivery and parcel takeaway?"`;

    case 'Clothing / Fashion':
      return `LEVEL 1 — BRAND & PRODUCT IDENTITY
• Brand name, collection/range name, article/style code.
• Target audience & gender (Men's, Women's, Unisex, Kids, Boys, Girls).
• Clothing category (Ethnic wear, Formal shirts/suits, Casual tees, Jeans/Denim, Activewear, Footwear).

LEVEL 2 — FABRIC, MATERIAL & BUILD QUALITY
• Exact fabric composition (e.g., 100% Combed Cotton, Linen-Cotton blend, Pure Silk, Georgette, Polyester blend).
• Fabric weight / thickness (GSM count, thread count), weave type (Twill, Poplin, Oxford, Jacquard).
• Breathability, softness, stretchability (Lycra/Spandex percentage), moisture-wicking properties.

LEVEL 3 — SIZING, FIT & MEASUREMENTS
• Available size options (XS, S, M, L, XL, XXL, 3XL or Numeric sizing like 30, 32, 34, 36, 38).
• Fit profile (Slim Fit, Regular Fit, Relaxed Fit, Oversized, Tailored Fit).
• Detailed size chart guide (Chest, length, shoulder, waist, inseam measurements in inches/cm).

LEVEL 4 — DESIGN, STYLING & OCCASION
• Available color options and official colorway names.
• Pattern & aesthetics (Solid, Striped, Checked, Floral printed, Graphic, Embroidered).
• Design highlights: Neckline/collar type, sleeve length (Full sleeve, Half sleeve), pocket styling, button/zipper details.
• Recommended occasions (Daily casual wear, Office formal, Wedding & Festive wear, Party, Sports/Gym).

LEVEL 5 — GARMENT CARE & WASHING INSTRUCTIONS
• Washing guidelines (Machine wash cold, Hand wash gently, Dry clean only).
• Bleach restrictions, tumble drying instructions, ironing temperature recommendations.
• Color bleed precautions, shrinkage expectations.

LEVEL 6 — PRICING, AVAILABILITY & RETURN POLICIES
• MRP (Maximum Retail Price) and discount selling price in Indian Rupees (₹).
• Availability across brand retail outlets, multi-brand stores, online marketplaces.
• Return & Exchange policy timeframe (e.g. 7 or 14 days exchange window for size/defect).
• Brand customer care contact, website, and authenticity guarantees.

LEVEL 7 — CUSTOMER QUESTIONS THIS RESEARCH MUST ANSWER
- "What is the fabric material and is it 100% cotton / pure linen?"
- "What sizes are available and what is the exact fit type (slim vs regular)?"
- "What are the wash care instructions (can it be machine washed)?"
- "What color options and patterns are available?"
- "What is the MRP / price and is there any return or exchange policy?"`;

    case 'Electronics':
    case 'Home Appliances':
      return `LEVEL 1 — PRODUCT IDENTITY & SPECIFICATIONS
• Brand name, exact model name and model number, appliance category (Smart TV, Refrigerator, AC, Washing Machine, Microwave, Soundbar, Water Purifier).
• Capacity / Size (e.g., 55-inch TV, 260 Litres Refrigerator, 1.5 Ton AC, 8 kg Washing Machine).

LEVEL 2 — TECHNICAL PERFORMANCE & CORE FEATURES
• Core technology (e.g. 4K HDR QLED, Inverter Compressor, Dual Inverter AC, Direct Drive Motor).
• Power specifications: Voltage (220-240V), Power wattage (W), Star Energy Efficiency Rating (BEE 1-Star to 5-Star rating).
• Annual electricity consumption estimate (kWh / Units per year).
• Stabilizer-free operation range (Operating voltage window, e.g. 100V to 300V).

LEVEL 3 — DIMENSIONS, WEIGHT & BUILD
• Product physical dimensions: Width x Height x Depth (mm or cm).
• Net weight (kg) and gross packaging weight.
• Build material, exterior finish / door finish, color options.

LEVEL 4 — CONNECTIVITY & SMART FEATURES
• Smart features & operating system (Google TV, Android, webOS, Tizen, Smart Home App integration with Wi-Fi/Bluetooth).
• Ports & Inputs: HDMI versions (e.g., HDMI 2.1 with eARC), USB ports, Optical Audio, LAN RJ-45, Antenna.
• Remote control type (Voice assistant remote with Netflix/Prime hotkeys, Solar remote).

LEVEL 5 — ACCESSORIES, INSTALLATION & DEMO
• In-box included items (Wall mount bracket, tabletop stand, remote with batteries, water inlet/drain pipes, power cord).
• Standard installation policy (Free standard brand installation vs paid, demo service timelines).

LEVEL 6 — WARRANTY, SERVICE & CUSTOMER SUPPORT
• Comprehensive product warranty period (e.g. 1 Year or 2 Years).
• Dedicated component warranty (e.g. 10 Years on Inverter Compressor / Motor).
• Brand authorized service center network availability, toll-free helpline number, support website.
• MRP and market retail price in Indian Rupees (₹).

LEVEL 7 — CUSTOMER QUESTIONS THIS RESEARCH MUST ANSWER
- "What is the capacity/size and energy star rating (BEE 3-Star vs 5-Star)?"
- "Does it require an external voltage stabilizer or is it stabilizer-free?"
- "What is the warranty period on the product and compressor/motor?"
- "Is installation and wall-mount bracket free with purchase?"
- "What smart features, Wi-Fi connectivity, and ports are available?"
- "What is the price in Indian Rupees and what accessories come in the box?"`;

    case 'Healthcare / Pharmacy':
      return `LEVEL 1 — DRUG & PRODUCT IDENTITY
• Product brand name, generic chemical / salt composition, manufacturer & marketing company.
• Therapeutic category (Analgesic, Antibiotic, Antacid, Antihistamine, Health Supplement, Medical Device).
• Dosage form (Tablet, Capsule, Syrup, Topical Gel, Ointment, Eye Drops, Inhaler).

LEVEL 2 — CLINICAL USES, INDICATIONS & BENEFITS
• Primary medical uses and health conditions treated.
• Mechanism of action (How it works in the body to relieve symptoms).
• Target patient group (Adults, Children, Geriatric, Dietary supplement users).

LEVEL 3 — DOSAGE, ADMINISTRATION & STRENGTH
• Available strength variants (e.g., 500mg, 650mg, 10mg/5ml).
• Standard recommended dosage guidelines (Always with advice to consult a physician).
• Administration instructions (Take with water after meals, on an empty stomach, etc.).
• Pack size & packaging type (Strip of 10/15 tablets, 100ml bottle, tube).

LEVEL 4 — PRECAUTIONS, CONTRAINDICATIONS & SIDE EFFECTS
• Common mild side effects (Nausea, drowsiness, dizziness, acidity).
• Contraindications (Pregnancy warnings, liver/kidney cautions, alcohol interactions).
• Storage conditions (Store below 25°C in a dry place, keep away from children).

LEVEL 5 — REGULATORY & PRICING
• Prescription status (Schedule H Prescription Drug vs Over-The-Counter OTC product).
• MRP (Maximum Retail Price) per strip/pack in Indian Rupees (₹).
• Shelf life / Expiry timeframe from manufacturing date.
• Customer helpline and manufacturer contact details.

LEVEL 6 — CUSTOMER QUESTIONS THIS RESEARCH MUST ANSWER
- "What are the active ingredients and medical uses of ${productName}?"
- "What is the recommended dosage and should it be taken before or after food?"
- "Are there any side effects, precautions, or contraindications?"
- "Is a doctor's prescription required (OTC vs Rx)?"
- "What is the price per strip/bottle and how should it be stored?"`;

    case 'Fitness / Gym':
      return `LEVEL 1 — FACILITY & BRAND IDENTITY
• Gym / Fitness centre name, category (Unisex Gym, Crossfit Box, Luxury Health Club, Yoga & Pilates Studio).
• Full physical address, locality, landmark, city, pin code.
• Operating hours: Morning slot timings, evening slot timings, Sunday hours.

LEVEL 2 — EQUIPMENT & WORKOUT ZONES
• Gym floor area (sq ft), interior air conditioning and ventilation standards.
• Cardio zone equipment (Treadmills, Ellipticals, Rowers, Spin bikes with brands like Life Fitness, Precor).
• Strength & Free weights zone (Squat racks, Dumbbells up to 50kg, Cable machines, Olympic barbells).
• Functional fitness zone (Battle ropes, Kettlebells, Plyometric boxes, Turf track).

LEVEL 3 — PROGRAMS & PERSONAL TRAINING
• Training disciplines offered (Strength & Bodybuilding, Weight Loss, HIIT, Crossfit, Zumba, Yoga, Martial Arts).
• Certified personal trainers (ACE, ACSM, K11 certified trainers), trainer-to-member ratios.
• Customized diet & nutrition counseling services.

LEVEL 4 — AMENITIES & HYGIENE
• Locker rooms, steam bath, sauna, hot showers, changing rooms.
• Drinking water stations, supplement / protein smoothie juice bar, valet/free car parking.

LEVEL 5 — MEMBERSHIP PLANS & PRICING
• Membership packages: 1 Month, 3 Months (Quarterly), 6 Months (Half-yearly), 12 Months (Annual) fees in Indian Rupees (₹).
• Registration fees, couple discounts, student discounts, complimentary trial sessions.
• Contact phone numbers, WhatsApp, official website, Instagram handle.

LEVEL 6 — CUSTOMER QUESTIONS THIS RESEARCH MUST ANSWER
- "What are the membership fees for 1 month, 3 months, and 1 year?"
- "What are the gym timings on weekdays and weekends?"
- "What fitness programs and personal training options are available?"
- "What amenities are provided (steam, lockers, showers, parking)?"
- "Do you offer a free trial workout session and how can I join?"`;

    case 'Salon / Beauty':
      return `LEVEL 1 — SALON IDENTITY & LOCATION
• Salon / Studio name, category (Unisex Salon, Luxury Hair Studio, Women's Beauty Lounge, Men's Grooming Bar, Bridal Makeup Studio).
• Exact address, landmark, parking availability, working hours and weekly off days.

LEVEL 2 — SERVICES & TREATMENTS MENU
• Hair Care: Haircuts, styling, hair spa, botox treatment, keratin, smoothening, global coloring, highlights.
• Skin & Facial: Cleanup, organic facials, anti-aging treatments, detan, bleach, hydra facial.
• Hands & Feet: Manicure, pedicure, nail art, gel extensions.
• Grooming: Threading, waxing (Rica / Honey wax), beard styling and trimming.
• Bridal & Groom packages: Pre-bridal skin care, HD / Airbrush bridal makeup, saree draping.

LEVEL 3 — PRODUCTS & HYGIENE STANDARDS
• Professional brand products used (L'Oreal Professionnel, Schwarzkopf, Olaplex, MAC, Kryolan, Lotus Herbals).
• Sanitized tools, disposable towels, sterilized equipment standards.

LEVEL 4 — SERVICE PRICING & PACKAGES
• Individual service rate card in Indian Rupees (₹).
• Popular combo packages (Haircut + Beard + Facial packages, Bridal packages).
• Appointment booking policy (Prior booking vs Walk-ins), home service availability.
• Contact phone number, WhatsApp for appointments, Instagram profile.

LEVEL 5 — CUSTOMER QUESTIONS THIS RESEARCH MUST ANSWER
- "What services are offered and what is the price list for haircuts, facials, and hair treatments?"
- "What are your operating hours and is advance appointment required?"
- "What professional product brands do you use?"
- "Do you offer bridal makeup packages and pre-bridal grooming?"
- "Where are you located and how can I book an appointment?"`;

    case 'Real Estate':
      return `LEVEL 1 — PROJECT IDENTITY & DEVELOPER
• Project name, real estate developer / builder group, brand track record.
• Property classification (Luxury High-Rise Apartments, Gated Community Villas, Commercial Office Spaces, Residential Plots).
• RERA Registration number and statutory approval status.

LEVEL 2 — LOCATION & CONNECTIVITY
• Full project address, locality, landmark, city, pin code.
• Proximity to key hubs: Distance to IT corridors, business parks, reputed schools, multi-specialty hospitals, shopping malls, metro stations, highway access.

LEVEL 3 — CONFIGURATIONS & FLOOR PLANS
• Available unit configurations (1 BHK, 2 BHK, 3 BHK, 4 BHK, Duplex Penthouses).
• Super built-up area and RERA Carpet area in square feet (sq ft).
• Floor plan highlights: Vastu compliance, balcony views, ventilation, ceiling heights.

LEVEL 4 — AMENITIES & LIFESTYLE FACILITIES
• Clubhouse area (sq ft), swimming pool (adults + kids pool), fully equipped gymnasium.
• Landscaped gardens, jogging track, children's play area, multipurpose sports courts (tennis, badminton, basketball).
• Security & Infrastructure: 24/7 CCTV surveillance, biometric access, 100% DG power backup, EV charging points, rainwater harvesting, sewage treatment plant (STP).

LEVEL 5 — PRICING, PAYMENT PLANS & FINANCING
• Price per square foot (₹ / sq ft), starting price and total cost for each configuration in Indian Rupees (Lakhs / Crores).
• Booking amount, construction-linked payment milestones.
• Home loan pre-approvals with major banks (SBI, HDFC, ICICI, Axis Bank).
• Possession timeline / handover date (Ready-to-move vs Under Construction).

LEVEL 6 — CUSTOMER QUESTIONS THIS RESEARCH MUST ANSWER
- "What are the available configurations (2 BHK, 3 BHK) and their carpet areas in sq ft?"
- "What is the total price / starting cost and booking amount?"
- "What is the RERA registration number and possession date?"
- "What amenities (clubhouse, pool, security, power backup) are provided?"
- "How far is the project from major IT parks, schools, and hospitals?"
- "Which banks have approved home loans for this project?"`;

    default:
      // Other / Custom Category
      return `LEVEL 1 — PRODUCT / SERVICE IDENTITY & ESSENCE
• Exact name, official title, brand / organization, model/code, classification (${effectiveType}).
• Core purpose: What problem does ${productName} solve, what is its primary function, and who is the ideal user?

LEVEL 2 — COMPLETE TECHNICAL & FUNCTIONAL SPECIFICATIONS
• Identify every physical, mechanical, chemical, digital, or operational attribute relevant to ${effectiveType}.
• Dimensions, weight, volume, capacity, materials, components, power requirements, compatibility, operating conditions.

LEVEL 3 — VARIANTS, EDITIONS & OPTIONS
• All available sizes, models, tiers, plans, versions, colors, or package configurations.
• Detail the exact differences between each variant.

LEVEL 4 — PRICING, OFFERS & COMMERCIAL TERMS
• Official price, MRP, subscription or fee structure in Indian Rupees (₹) where known.
• Additional charges, discounts, bundles, payment terms, refund/return policies.

LEVEL 5 — KEY FEATURES & FACTUAL CUSTOMER BENEFITS
• Major capabilities, innovative features, practical advantages over alternatives.
• Avoid promotional marketing fluff; focus on measurable, factual benefits.

LEVEL 6 — PRACTICAL USAGE, SETUP, SAFETY & LIMITATIONS
• How to use, install, consume, operate, or maintain ${productName}.
• Safety warnings, usage limitations, compatibility requirements, operating boundaries.

LEVEL 7 — AVAILABILITY, WARRANTY & SUPPORT
• Sourcing channels (Online, retail stores, direct booking, authorized distributors).
• Warranty terms, customer support contact numbers, email, website, service centers.

LEVEL 8 — CUSTOMER QUESTIONS THIS RESEARCH MUST DIRECTLY ANSWER
- "What is ${productName} and what are its key features and specifications?"
- "How much does it cost and what variants or plans are available?"
- "Who is it suitable for and what are its main practical benefits?"
- "How do I use / operate / install / maintain it?"
- "What are its limitations, warranty terms, and where can I purchase or contact support?"`;
  }
}
