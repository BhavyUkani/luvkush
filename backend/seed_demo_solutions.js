const mysql = require('mysql2/promise');
require('dotenv').config();

const WIGS = [
  {
    name: 'Premium French Lace Wig (Men)',
    slug: 'premium-french-lace-wig-men',
    category_id: 15, // Men's Wigs
    type: 'wig',
    gender: 'male',
    base_price: 15000.00,
    mrp: 22000.00,
    size_info: '6x8, 7x9, 8x10, 9x11',
    colour_info: 'Natural Black, Dark Brown',
    short_description: 'Extremely breathable and lightweight French lace base for a completely natural front hairline.',
    description: '<p>Our Premium French Lace Wig offers unparalleled comfort and breathability. Made with 100% Remy human hair, it features a hand-tied French lace base that mimics the natural scalp. Ideal for warm climates and active lifestyles.</p>',
    how_to_use: '1. Clean the scalp thoroughly with alcohol.\n2. Apply ultra-hold adhesive or tape to the perimeter.\n3. Position the front edge of the lace wig and press firmly, rolling it back over the scalp.',
    payment_mode: 'hybrid',
    advance_amount: 3000.00,
    status: 'active',
    is_featured: 1,
    hair_type: 'straight',
    cap_construction: 'full_lace',
    hair_source: '100_remy',
    density: 'medium',
    maintenance_level: 'medium',
    available_lengths: '["8", "10", "12"]',
    available_colors: '["Natural Black", "Dark Brown"]'
  },
  {
    name: 'Ultra HD Frontal Wig (Ladies)',
    slug: 'ultra-hd-frontal-wig-ladies',
    category_id: 16, // Ladies' Wigs
    type: 'wig',
    gender: 'female',
    base_price: 32000.00,
    mrp: 45000.00,
    size_info: 'Medium, Large, Small',
    colour_info: 'Natural Black, Dark Brown, Honey Blonde',
    short_description: 'Invisible HD Swiss lace frontal wig for a seamless hairline and versatile styling.',
    description: '<p>The Ultra HD Frontal Wig features premium Swiss lace that melts invisibly into any skin tone. With high-density 100% Remy hair, it allows for deep parting, high ponytails, and heat styling just like your natural hair.</p>',
    how_to_use: '1. Prep natural hair by braiding it flat.\n2. Apply a skin protector and lace adhesive along the hairline.\n3. Position the HD lace frontal, press down, and secure with a band until dry.',
    payment_mode: 'full_online',
    advance_amount: null,
    status: 'active',
    is_featured: 1,
    hair_type: 'wavy',
    cap_construction: 'lace_front',
    hair_source: 'european',
    density: 'heavy',
    maintenance_level: 'high',
    available_lengths: '["18", "20", "22", "24"]',
    available_colors: '["Natural Black", "Dark Brown", "Honey Blonde"]'
  },
  {
    name: 'Monofilament Silk Top Wig (Ladies)',
    slug: 'monofilament-silk-top-wig-ladies',
    category_id: 16,
    type: 'wig',
    gender: 'female',
    base_price: 38000.00,
    mrp: 52000.00,
    size_info: 'Medium, Large',
    colour_info: 'Natural Black, Chocolate Brown',
    short_description: 'Multi-directional parting with a silk top base that looks exactly like a real scalp.',
    description: '<p>Enjoy ultimate styling freedom with our Monofilament Silk Top Wig. The double-layered silk top conceals the hair knots, making it appear as though the hair is growing directly out of your scalp. Features premium European human hair.</p>',
    how_to_use: 'Fit the wig securely using the adjustable straps and combs. For a semi-permanent attachment, cosmetic-grade tapes can be used on the polyurethane perimeter.',
    payment_mode: 'partial',
    advance_amount: 5000.00,
    status: 'active',
    is_featured: 0,
    hair_type: 'straight',
    cap_construction: 'monofilament',
    hair_source: 'european',
    density: 'medium',
    maintenance_level: 'high',
    available_lengths: '["14", "16", "18"]',
    available_colors: '["Natural Black", "Chocolate Brown"]'
  },
  {
    name: 'Classic Men Toupee Fine Mono Wig',
    slug: 'classic-men-toupee-fine-mono-wig',
    category_id: 15,
    type: 'wig',
    gender: 'male',
    base_price: 12000.00,
    mrp: 18000.00,
    size_info: '7x9, 8x10, 9x11',
    colour_info: 'Natural Black, Ash Black, Dark Brown',
    short_description: 'Highly durable fine mono center with a thin skin poly perimeter for easy cleaning.',
    description: '<p>Our Classic Men\'s Toupee is designed for maximum durability. The center consists of fine monofilament mesh, surrounded by a NPU skin border that resists tearing and allows easy application of tape or glue.</p>',
    how_to_use: 'Shave the thinning area on the crown. Apply waterproof liquid adhesive to the scalp, let it dry until tacky, and carefully roll the toupee from front to back.',
    payment_mode: 'full_cod',
    advance_amount: null,
    status: 'active',
    is_featured: 0,
    hair_type: 'straight',
    cap_construction: 'hybrid',
    hair_source: 'indian_remy',
    density: 'medium',
    maintenance_level: 'low',
    available_lengths: '["6"]',
    available_colors: '["Natural Black", "Ash Black", "Dark Brown"]'
  },
  {
    name: 'Full Cap Luxury Remy Wig (Ladies)',
    slug: 'full-cap-luxury-remy-wig-ladies',
    category_id: 16,
    type: 'wig',
    gender: 'female',
    base_price: 45000.00,
    mrp: 65000.00,
    size_info: 'Small, Medium, Large',
    colour_info: 'Natural Black, Dark Brown, Auburn',
    short_description: 'Full hand-tied premium Remy hair wig with 360-degree full lace construction.',
    description: '<p>A masterpiece of luxury, our 360 Full Lace Remy Wig is completely hand-knotted. This allows for styling in any direction including high updos. Experience natural movement and premium comfort all day long.</p>',
    how_to_use: 'Apply a wig cap, align the front lace with your natural hairline, and secure with lace adhesive or clips at the back and sides.',
    payment_mode: 'full_online',
    advance_amount: null,
    status: 'active',
    is_featured: 1,
    hair_type: 'curly',
    cap_construction: 'full_lace',
    hair_source: '100_remy',
    density: 'heavy',
    maintenance_level: 'high',
    available_lengths: '["16", "20", "24"]',
    available_colors: '["Natural Black", "Dark Brown", "Auburn"]'
  },
  {
    name: 'Full Polyurethane Skin Wig (Men)',
    slug: 'full-polyurethane-skin-wig-men',
    category_id: 15,
    type: 'wig',
    gender: 'male',
    base_price: 18000.00,
    mrp: 26000.00,
    size_info: '6x8, 7x9, 8x10',
    colour_info: 'Natural Black, Grey Blend (10% Grey)',
    short_description: 'Super thin skin base wig that feels like a second layer of skin on the scalp.',
    description: '<p>Our Full Polyurethane Skin Wig utilizes a 0.08mm bio-skin base. The hair is loop V-injected without knots, creating the illusion of hair emerging naturally from the skin. 100% invisible base.</p>',
    how_to_use: 'Clean the skin base and scalp with rubbing alcohol. Apply medical-grade liquid adhesive, and place the wig starting from the forehead center.',
    payment_mode: 'hybrid',
    advance_amount: 4000.00,
    status: 'active',
    is_featured: 0,
    hair_type: 'straight',
    cap_construction: 'polyurethane',
    hair_source: 'indian_remy',
    density: 'medium',
    maintenance_level: 'medium',
    available_lengths: '["6"]',
    available_colors: '["Natural Black", "Grey Blend"]'
  },
  {
    name: 'Swiss Lace Front Custom Wig (Men)',
    slug: 'swiss-lace-front-custom-wig-men',
    category_id: 15,
    type: 'wig',
    gender: 'male',
    base_price: 21000.00,
    mrp: 30000.00,
    size_info: '7x9, 8x10, 8x11',
    colour_info: 'Natural Black, Dark Brown',
    short_description: 'Softest Swiss lace front wig providing absolute comfort and an invisible hairline.',
    description: '<p>Crafted for comfort, the Swiss Lace Front Wig features premium, breathable Swiss lace at the front hairline, transitionally blending into a fine mono structure. Hand-knotted with bleached knots.</p>',
    how_to_use: 'Trim the excess lace, apply skin protector, put adhesive tape or glue on the lace area, and press down firmly for 3 minutes.',
    payment_mode: 'partial',
    advance_amount: 3000.00,
    status: 'active',
    is_featured: 0,
    hair_type: 'wavy',
    cap_construction: 'lace_front',
    hair_source: '100_remy',
    density: 'medium',
    maintenance_level: 'medium',
    available_lengths: '["6", "8"]',
    available_colors: '["Natural Black", "Dark Brown"]'
  },
  {
    name: 'Bob Style Frontal Wig (Ladies)',
    slug: 'bob-style-frontal-wig-ladies',
    category_id: 16,
    type: 'wig',
    gender: 'female',
    base_price: 24000.00,
    mrp: 35000.00,
    size_info: 'Small, Medium',
    colour_info: 'Natural Black, Honey Highlights',
    short_description: 'Sleek, short bob style wig with a realistic lace front parting.',
    description: '<p>A classic, stylish Bob Cut Wig. Pre-plucked with baby hairs along the hairline, it offers a chic and professional look. Made from high-grade human hair that can be straightened or curled.</p>',
    how_to_use: 'Adjust the inner straps to fit your head circumference, cut the front lace, and secure with the built-in combs.',
    payment_mode: 'full_cod',
    advance_amount: null,
    status: 'active',
    is_featured: 0,
    hair_type: 'straight',
    cap_construction: 'lace_front',
    hair_source: '100_remy',
    density: 'medium',
    maintenance_level: 'medium',
    available_lengths: '["10", "12"]',
    available_colors: '["Natural Black", "Honey Highlights"]'
  },
  {
    name: 'Kinky Curly Glueless Wig (Ladies)',
    slug: 'kinky-curly-glueless-wig-ladies',
    category_id: 16,
    type: 'wig',
    gender: 'female',
    base_price: 29000.00,
    mrp: 40000.00,
    size_info: 'Medium, Large',
    colour_info: 'Natural Black',
    short_description: 'Bouncy kinky curls with a 3D dome cap that requires no glue or adhesive.',
    description: '<p>Perfect for quick wear, this Glueless Curly Wig features an elastic band and silicone grips inside the cap to hold it securely. Pre-styled into voluminous kinky curls with maximum bounce.</p>',
    how_to_use: 'Simply wear the wig cap, adjust the elastic band inside the wig, place it on your head, and style the curls with a wide-tooth comb.',
    payment_mode: 'hybrid',
    advance_amount: 2000.00,
    status: 'active',
    is_featured: 0,
    hair_type: 'curly',
    cap_construction: 'hybrid',
    hair_source: '100_remy',
    density: 'heavy',
    maintenance_level: 'high',
    available_lengths: '["14", "16", "18"]',
    available_colors: '["Natural Black"]'
  },
  {
    name: 'Premium Mono-Lace Hybrid Wig (Men)',
    slug: 'premium-mono-lace-hybrid-wig-men',
    category_id: 15,
    type: 'wig',
    gender: 'male',
    base_price: 16500.00,
    mrp: 24000.00,
    size_info: '6x8, 7x9, 8x10, 9x11',
    colour_info: 'Natural Black, Dark Brown, Medium Brown',
    short_description: 'Combines the natural hairline of a French lace front with the durability of a mono center.',
    description: '<p>The ultimate hybrid wig. Enjoy an invisible front hairline from the French lace front, while the fine mono center gives a long-lasting, sturdy structure that handles daily wear and washing easily.</p>',
    how_to_use: 'Clean scalp, place double-sided tape on the polyurethane border, apply liquid glue to the lace front, align, and press.',
    payment_mode: 'hybrid',
    advance_amount: 3500.00,
    status: 'active',
    is_featured: 1,
    hair_type: 'straight',
    cap_construction: 'hybrid',
    hair_source: '100_remy',
    density: 'medium',
    maintenance_level: 'medium',
    available_lengths: '["6", "8"]',
    available_colors: '["Natural Black", "Dark Brown", "Medium Brown"]'
  }
];

const PATCHES = [
  {
    name: 'Micro Skin V-Loop Hair Patch',
    slug: 'micro-skin-v-loop-hair-patch',
    category_id: 17, // Hair Patches
    type: 'patch',
    gender: 'male',
    base_price: 8500.00,
    mrp: 13000.00,
    size_info: '6x8, 7x9, 8x10',
    colour_info: 'Natural Black, Dark Brown',
    short_description: 'Seamless V-loop ventilation on an ultra-thin skin base for an invisible scalp effect.',
    description: '<p>The Micro Skin V-Loop Hair Patch uses a paper-thin polyurethane base. Hair is injected via a knotless V-loop technique, making it perfect for brushing in any direction, including straight back.</p>',
    how_to_use: 'Cleanse scalp, cut the skin patch base to the exact shape of the bald area, apply thin skin adhesive, and bond securely.',
    payment_mode: 'hybrid',
    advance_amount: 1500.00,
    status: 'active',
    is_featured: 1,
    hair_type: 'straight',
    cap_construction: 'polyurethane',
    hair_source: 'indian_remy',
    density: 'medium',
    maintenance_level: 'medium',
    available_lengths: '["6"]',
    available_colors: '["Natural Black", "Dark Brown"]'
  },
  {
    name: 'Silk Base Crown Hair Patch',
    slug: 'silk-base-crown-hair-patch',
    category_id: 17,
    type: 'patch',
    gender: 'male',
    base_price: 11000.00,
    mrp: 16500.00,
    size_info: '6x8, 7x9, 8x10, 9x11',
    colour_info: 'Natural Black, Dark Brown',
    short_description: 'High-end silk base crown patch mimicking real skin follicles perfectly.',
    description: '<p>Designed for crown hair thinning. The Silk Base Hair Patch consists of a three-layered silk mesh that completely conceals the hair knots, looking 100% natural even under close inspection.</p>',
    how_to_use: 'Prepare scalp, align the patch at the crown area, and attach using cosmetic clips or medical-grade tape along the polyurethane edge.',
    payment_mode: 'partial',
    advance_amount: 2500.00,
    status: 'active',
    is_featured: 1,
    hair_type: 'straight',
    cap_construction: 'monofilament',
    hair_source: '100_remy',
    density: 'medium',
    maintenance_level: 'medium',
    available_lengths: '["6", "8"]',
    available_colors: '["Natural Black", "Dark Brown"]'
  },
  {
    name: 'Front Lace Breathable Hair Patch',
    slug: 'front-lace-breathable-hair-patch',
    category_id: 17,
    type: 'patch',
    gender: 'male',
    base_price: 9500.00,
    mrp: 14500.00,
    size_info: '5x7, 6x8, 7x9, 8x10',
    colour_info: 'Natural Black, Dark Brown',
    short_description: 'Breathable Swiss lace front patch with a durable mono center.',
    description: '<p>This patch offers the best of both worlds: a highly breathable, invisible lace front hairline with a durable monofilament mesh center that handles moisture and sweat extremely well.</p>',
    how_to_use: 'Apply double-sided hair patch tape to the polyurethane border. Apply a small amount of liquid lace glue to the front lace and attach to scalp.',
    payment_mode: 'full_cod',
    advance_amount: null,
    status: 'active',
    is_featured: 0,
    hair_type: 'wavy',
    cap_construction: 'hybrid',
    hair_source: 'indian_remy',
    density: 'medium',
    maintenance_level: 'low',
    available_lengths: '["6"]',
    available_colors: '["Natural Black", "Dark Brown"]'
  },
  {
    name: 'Super Thin Poly 0.03mm Hair Patch',
    slug: 'super-thin-poly-0-03mm-hair-patch',
    category_id: 17,
    type: 'patch',
    gender: 'male',
    base_price: 13500.00,
    mrp: 19000.00,
    size_info: '6x8, 7x9, 8x10',
    colour_info: 'Natural Black',
    short_description: 'Ultra-thin bio-skin hair patch for a totally seamless feel.',
    description: '<p>The thinnest skin base available on the market. With a base thickness of just 0.03mm, it integrates completely with your scalp. Must be handled with care. Lasts 3-6 months.</p>',
    how_to_use: 'Shave target area, apply a thin coat of skin glue, lay patch down carefully without air bubbles, and press firmly.',
    payment_mode: 'full_online',
    advance_amount: null,
    status: 'active',
    is_featured: 0,
    hair_type: 'straight',
    cap_construction: 'polyurethane',
    hair_source: '100_remy',
    density: 'light',
    maintenance_level: 'high',
    available_lengths: '["6"]',
    available_colors: '["Natural Black"]'
  },
  {
    name: 'Clip-On Custom Hair Patch (Unisex)',
    slug: 'clip-on-custom-hair-patch-unisex',
    category_id: 17,
    type: 'patch',
    gender: 'other',
    base_price: 7500.00,
    mrp: 11000.00,
    size_info: '5x7, 6x8, 7x9',
    colour_info: 'Natural Black, Dark Brown, Light Brown',
    short_description: 'Easy-to-use clip-on hair patch that requires no glue, tape, or shaving.',
    description: '<p>A perfect daily-wear patch. Comes with high-tension silicone-lined clips pre-attached to the border. Simply clip it onto your existing hair to cover thinning patches instantly.</p>',
    how_to_use: 'Align the patch over the thinning area, slide the clips into your natural hair, and press to snap them shut. Blend with a comb.',
    payment_mode: 'full_cod',
    advance_amount: null,
    status: 'active',
    is_featured: 0,
    hair_type: 'straight',
    cap_construction: 'hybrid',
    hair_source: 'indian_remy',
    density: 'medium',
    maintenance_level: 'low',
    available_lengths: '["6", "8"]',
    available_colors: '["Natural Black", "Dark Brown", "Light Brown"]'
  },
  {
    name: 'Fine Welded Mono Toupee Patch',
    slug: 'fine-welded-mono-toupee-patch',
    category_id: 17,
    type: 'patch',
    gender: 'male',
    base_price: 9000.00,
    mrp: 14000.00,
    size_info: '6x8, 7x9, 8x10, 8x11',
    colour_info: 'Natural Black, Dark Brown',
    short_description: 'Strong, breathable welded mono patch for active sports and heavy sweating.',
    description: '<p>Constructed with durable welded monofilament lace. This patch allows hot air and sweat to escape instantly, making it the top choice for athletes and gym-goers.</p>',
    how_to_use: 'Bond using waterproof tape or adhesive around the perimeter, leave the center dry for maximum airflow.',
    payment_mode: 'hybrid',
    advance_amount: 2000.00,
    status: 'active',
    is_featured: 0,
    hair_type: 'wavy',
    cap_construction: 'monofilament',
    hair_source: 'indian_remy',
    density: 'medium',
    maintenance_level: 'low',
    available_lengths: '["6"]',
    available_colors: '["Natural Black", "Dark Brown"]'
  },
  {
    name: 'Injection Skin Seamless Patch',
    slug: 'injection-skin-seamless-patch',
    category_id: 17,
    type: 'patch',
    gender: 'male',
    base_price: 12500.00,
    mrp: 18000.00,
    size_info: '6x8, 7x9, 8x10',
    colour_info: 'Natural Black, Grey Blend (20% Grey)',
    short_description: 'Premium injected hair patch on a durable silicone skin base.',
    description: '<p>The Injection Skin Patch has hairs inserted at an angle to mimic natural hair growth directions. Made from highly durable polyurethane skin, it can be re-bonded multiple times.</p>',
    how_to_use: 'Apply standard skin adhesive to scalp, position patch, and press down. Best bonded for 3-4 weeks.',
    payment_mode: 'partial',
    advance_amount: 3000.00,
    status: 'active',
    is_featured: 0,
    hair_type: 'straight',
    cap_construction: 'polyurethane',
    hair_source: '100_remy',
    density: 'medium',
    maintenance_level: 'medium',
    available_lengths: '["6"]',
    available_colors: '["Natural Black", "Grey Blend"]'
  },
  {
    name: 'French Lace Center Sport Patch',
    slug: 'french-lace-center-sport-patch',
    category_id: 17,
    type: 'patch',
    gender: 'male',
    base_price: 10500.00,
    mrp: 15500.00,
    size_info: '6x8, 7x9, 8x10',
    colour_info: 'Natural Black, Ash Brown',
    short_description: 'French lace base with a skin border for the perfect mix of realism and durability.',
    description: '<p>Designed for active individuals who want a natural look. Features a full French lace center for high ventilation and a skin border that simplifies clean-ups and tape attachments.</p>',
    how_to_use: 'Apply tape to the skin border. Use adhesive glue on the front lace area for a seamless hairline finish.',
    payment_mode: 'hybrid',
    advance_amount: 2500.00,
    status: 'active',
    is_featured: 1,
    hair_type: 'wavy',
    cap_construction: 'hybrid',
    hair_source: '100_remy',
    density: 'medium',
    maintenance_level: 'medium',
    available_lengths: '["6"]',
    available_colors: '["Natural Black", "Ash Brown"]'
  },
  {
    name: 'Ladies Crown Volumizer Patch',
    slug: 'ladies-crown-volumizer-patch',
    category_id: 17,
    type: 'patch',
    gender: 'female',
    base_price: 14000.00,
    mrp: 20000.00,
    size_info: '5x5, 6x6, 7x7',
    colour_info: 'Natural Black, Dark Brown, Auburn Highlights',
    short_description: 'Small silk top patch designed to add instant volume to the partition or crown.',
    description: '<p>A discreet volumizing patch for ladies. Perfect for covering partition widening or crown thinning. Built on a soft silk base that blends seamlessly with your parting.</p>',
    how_to_use: 'Section hair, align partition, secure with the integrated anti-slip clips, and comb your own hair over to blend.',
    payment_mode: 'partial',
    advance_amount: 4000.00,
    status: 'active',
    is_featured: 0,
    hair_type: 'straight',
    cap_construction: 'monofilament',
    hair_source: '100_remy',
    density: 'medium',
    maintenance_level: 'medium',
    available_lengths: '["10", "12", "14"]',
    available_colors: '["Natural Black", "Dark Brown", "Auburn Highlights"]'
  },
  {
    name: 'Super Lace Ultra Thin Hair Patch',
    slug: 'super-lace-ultra-thin-hair-patch',
    category_id: 17,
    type: 'patch',
    gender: 'male',
    base_price: 11500.00,
    mrp: 17000.00,
    size_info: '6x8, 7x9, 8x10, 9x11',
    colour_info: 'Natural Black, Dark Brown',
    short_description: 'Full Swiss lace base patch for absolute realism and maximum comfort.',
    description: '<p>Our most realistic patch. The entire base is made of feather-light Swiss lace, offering maximum ventilation and an invisible hairline from all angles. Hand-tied Remy human hair.</p>',
    how_to_use: 'Clean scalp, apply lace adhesive along the hairline, attach front of patch first, roll back, and press down.',
    payment_mode: 'hybrid',
    advance_amount: 3000.00,
    status: 'active',
    is_featured: 1,
    hair_type: 'straight',
    cap_construction: 'full_lace',
    hair_source: '100_remy',
    density: 'medium',
    maintenance_level: 'high',
    available_lengths: '["6", "8"]',
    available_colors: '["Natural Black", "Dark Brown"]'
  }
];

const IMAGES = [
  '/uploads/hair-solutions/hs-1-1782161430191.webp',
  '/uploads/hair-solutions/hs-1-1782161664938.webp',
  '/uploads/hair-solutions/hs-1-1782161834792.webp'
];

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'luvkush_natural',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    multipleStatements: true
  });

  try {
    console.log('Starting seed process for demo hair solutions...');

    const allSlugs = [...WIGS, ...PATCHES].map(item => item.slug);

    // 1. Delete existing matching reviews, variants, products, and solutions to avoid key conflicts
    console.log('Cleaning up existing demo solutions...');
    
    // Find matching product IDs
    const [matchingProds] = await connection.execute(
      `SELECT id FROM products WHERE slug IN (${allSlugs.map(() => '?').join(',')})`,
      allSlugs
    );

    if (matchingProds.length > 0) {
      const prodIds = matchingProds.map(p => p.id);
      
      // Delete reviews for these products
      await connection.execute(
        `DELETE FROM reviews WHERE product_id IN (${prodIds.map(() => '?').join(',')})`,
        prodIds
      );

      // Delete product variants
      await connection.execute(
        `DELETE FROM product_variants WHERE product_id IN (${prodIds.map(() => '?').join(',')})`,
        prodIds
      );
      
      // Delete hair solutions
      await connection.execute(
        `DELETE FROM hair_solutions WHERE product_id IN (${prodIds.map(() => '?').join(',')})`,
        prodIds
      );

      // Delete products
      await connection.execute(
        `DELETE FROM products WHERE id IN (${prodIds.map(() => '?').join(',')})`,
        prodIds
      );
    }

    // Also delete by slug just in case some entries are disconnected
    await connection.execute(
      `DELETE FROM hair_solutions WHERE slug IN (${allSlugs.map(() => '?').join(',')})`,
      allSlugs
    );

    console.log('Clean up of products and solutions complete.');

    // 2. Create mock reviewers
    console.log('Creating mock reviewer users...');
    const reviewerNames = ['Aravind Sharma', 'Vikram Malhotra', 'Sneha Kapoor', 'Rajesh Patel', 'Amit Verma'];
    const reviewerEmails = [
      'aravind.sharma@example.com',
      'vikram.malhotra@example.com',
      'sneha.kapoor@example.com',
      'rajesh.patel@example.com',
      'amit.verma@example.com'
    ];
    const reviewerIds = [];

    for (let i = 0; i < reviewerNames.length; i++) {
      const email = reviewerEmails[i];
      const nameParts = reviewerNames[i].split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts[1] || '';

      // Delete existing reviewer to allow re-runs
      await connection.execute('DELETE FROM users WHERE email = ?', [email]);

      const [userRes] = await connection.execute(`
        INSERT INTO users (
          first_name, last_name, email, password_hash, role, status
        ) VALUES (?, ?, ?, ?, 'customer', 'active')
      `, [
        firstName,
        lastName,
        email,
        '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/ZNbxf5e' // Admin@123
      ]);
      reviewerIds.push(userRes.insertId);
    }
    console.log(`Mock reviewers created with IDs: ${reviewerIds.join(', ')}`);

    // 3. Insert items
    const itemsToSeed = [...WIGS, ...PATCHES];
    let count = 0;

    for (const item of itemsToSeed) {
      console.log(`Seeding: ${item.name} (${item.slug})...`);

      // Determine images array for this item
      const itemImages = JSON.stringify(IMAGES);
      const primaryImage = IMAGES[count % IMAGES.length];

      // Insert product
      const [prodRes] = await connection.execute(`
        INSERT INTO products (
          category_id, name, slug, sku, subtitle, description, short_description,
          how_to_use, price, mrp, stock_quantity, status, payment_mode, advance_amount, 
          tags, primary_image, images, is_featured, rating_avg, rating_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        item.category_id,
        item.name,
        item.slug,
        `LKN-HS-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        item.type === 'wig' ? 'Hair Wig' : 'Hair Patch',
        item.description,
        item.short_description,
        item.how_to_use,
        item.base_price,
        item.mrp,
        99,
        item.status,
        item.payment_mode,
        item.advance_amount,
        'hair-solution',
        primaryImage,
        itemImages,
        item.is_featured,
        4.6, // Initial rating
        5    // Initial count
      ]);

      const productId = prodRes.insertId;

      // Insert size variants with price modifiers to showcase price changes
      const sizes = item.size_info.split(',').map(s => s.trim()).filter(Boolean);
      for (let i = 0; i < sizes.length; i++) {
        const sizeVal = sizes[i];
        // Give sizes subsequent price modifiers (+0, +1500, +3000, +4500 etc.)
        const priceModifier = i * 1500;
        await connection.execute(`
          INSERT INTO product_variants (
            product_id, name, value, sku, price_modifier, stock_quantity, status, display_order
          ) VALUES (?, 'Size', ?, ?, ?, 99, 'active', ?)
        `, [
          productId, 
          sizeVal, 
          `LKN-HSVAR-${productId}-${i}-${Math.floor(Math.random() * 100)}`, 
          priceModifier, 
          i + 1
        ]);
      }

      // Insert hair solution
      await connection.execute(`
        INSERT INTO hair_solutions (
          category_id, name, slug, description, short_description, base_price, mrp,
          gender, size_info, colour_info, how_to_use, type, status, product_id, 
          payment_mode, advance_amount, hair_type, cap_construction, hair_source, 
          density, available_lengths, available_colors, maintenance_level, 
          primary_image, images, is_featured
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        item.category_id,
        item.name,
        item.slug,
        item.description,
        item.short_description,
        item.base_price,
        item.mrp,
        item.gender,
        item.size_info,
        item.colour_info,
        item.how_to_use,
        item.type,
        item.status,
        productId,
        item.payment_mode,
        item.advance_amount,
        item.hair_type,
        item.cap_construction,
        item.hair_source,
        item.density,
        item.available_lengths,
        item.available_colors,
        item.maintenance_level,
        primaryImage,
        itemImages,
        item.is_featured
      ]);

      // Seed 5 demo reviews for each item using the created reviewers
      const reviewTitles = ['Life changing product!', 'Very natural look', 'Highly recommended', 'Great quality and fit', 'Good value for money'];
      const reviewBodies = [
        'I was skeptical at first, but this has completely restored my confidence. The fit is perfect, and it feels exactly like real hair.',
        'The hairline is practically invisible. People cannot tell I am wearing a hair solution at all. Extremely satisfied.',
        'Super comfortable to wear even for long hours. The breathability is amazing. Will definitely buy again.',
        'Great build quality. The hair texture matches my own perfectly. Customer service was also very helpful with sizing advice.',
        'Excellent value. Looks premium and fits well. Took a few days to get used to it, but now it feels like a second skin.'
      ];

      for (let r = 0; r < 5; r++) {
        await connection.execute(`
          INSERT INTO reviews (
            product_id, user_id, rating, title, body, is_verified_purchase, status
          ) VALUES (?, ?, ?, ?, ?, ?, 'approved')
        `, [
          productId,
          reviewerIds[r],
          Math.floor(Math.random() * 2) + 4, // 4 or 5 stars
          reviewTitles[r],
          reviewBodies[r],
          1
        ]);
      }

      count++;
    }

    console.log(`Successfully seeded ${WIGS.length} Hair Wigs and ${PATCHES.length} Hair Patches.`);

  } catch (err) {
    console.error('Error during seeding:', err);
  } finally {
    await connection.end();
  }
}

main();
