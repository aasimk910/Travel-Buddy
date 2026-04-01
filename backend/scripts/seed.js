// backend/scripts/seed.js
// Standalone CLI script that seeds the database with sample data.
// Clears existing records and inserts dummy admin user, hotels, packages, hikes, and products.
// Usage: node scripts/seed.js  (run from backend/)

// #region Imports
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

// #endregion Imports
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const User = require("../models/User");
const Hotel = require("../models/Hotel");
const HotelPackage = require("../models/HotelPackage");
const Hike = require("../models/Hike");
const Product = require("../models/Product");

const MONGO_URI = process.env.MONGO_URI;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME;

// Main seeding function — connects to DB, wipes collections, inserts sample records
async function seedDatabase() {
  try {
    const connectOptions = {};
    // Fall back to explicit dbName when the URI doesn't embed one
    if (!MONGO_URI.includes("travelbuddy")) {
      connectOptions.dbName = MONGO_DB_NAME || "travelbuddy";
    }

    await mongoose.connect(MONGO_URI, connectOptions);
    console.log("✅ Connected to MongoDB");

    // Clear existing data from all seeded collections
    console.log("🧹 Clearing existing data...");
    await User.deleteMany({});
    await Hotel.deleteMany({});
    await HotelPackage.deleteMany({});
    await Hike.deleteMany({});
    await Product.deleteMany({});

    // Create a dummy admin user that owns the seeded hikes
    console.log("👤 Creating dummy user...");
    const hashedPassword = await bcrypt.hash("password123", 10);
    const adminUser = new User({
      name: "Travel Buddy Admin",
      email: "admin@travelbuddy.com",
      password: hashedPassword,
      role: "admin",
      verified: true,
    });
    await adminUser.save();
    console.log(`  ✅ Created: ${adminUser.name}`);

    // Seed Hotels with Packages
    console.log("🏨 Seeding hotels...");
    const hotelsData = [
      {
        name: "Himalayan Horizon Hotel",
        location: "Pokhara, Nepal",
        coordinates: { lat: 28.2096, lng: 83.9856 },
        description: "Boutique hotel perched above Pokhara with panoramic Annapurna Range views and an infinity pool",
        contactPhone: "+977-61-530000",
        email: "stay@himalayanhorizon.com",
        website: "https://himalayanhorizon.com",
        imageUrl: "https://images.unsplash.com/photo-1566658529124-3be32fe00c94?w=500",
        rating: 4.9,
        reviewCount: 214,
        amenities: ["WiFi", "Infinity Pool", "Mountain View", "Spa", "Yoga Deck", "Organic Restaurant"],
      },
      {
        name: "Phewa Pearl Lakeside Resort",
        location: "Pokhara, Nepal",
        coordinates: { lat: 28.2043, lng: 83.9854 },
        description: "Eco-luxury lakeside resort with a private boat jetty and overwater bungalows on Phewa Lake",
        contactPhone: "+977-61-472000",
        email: "info@phewapearl.com",
        website: "https://phewapearl.com",
        imageUrl: "https://images.unsplash.com/photo-1571003123894-169987b86f0d?w=500",
        rating: 4.7,
        reviewCount: 138,
        amenities: ["WiFi", "Private Boat Jetty", "Lake View", "Infinity Pool", "Bar", "Kayak Rental"],
      },
      {
        name: "Boudhanath Grand",
        location: "Kathmandu, Nepal",
        coordinates: { lat: 27.7215, lng: 85.3620 },
        description: "Serene luxury hotel steps from the sacred Boudhanath Stupa with traditional Newari architecture",
        contactPhone: "+977-1-4480000",
        email: "reserve@boudhanathgrand.com",
        website: "https://boudhanathgrand.com",
        imageUrl: "https://images.unsplash.com/photo-1580828343991-fd09a7c0bfa0?w=500",
        rating: 4.6,
        reviewCount: 289,
        amenities: ["WiFi", "Rooftop Stupa View", "Cultural Tours", "Meditation Garden", "Fine Dining"],
      },
      {
        name: "Everest Sherpa Lodge",
        location: "Namche Bazaar, Everest Region",
        coordinates: { lat: 27.8084, lng: 86.7115 },
        description: "Traditional Sherpa teahouse upgraded to a comfortable lodge with heated rooms and a bakery",
        contactPhone: "+977-3-390044",
        email: "lodge@everestsherpa.com",
        website: "https://everestsherpalodge.com",
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500",
        rating: 4.6,
        reviewCount: 195,
        amenities: ["Heated Rooms", "Hot Shower", "Bakery", "Restaurant", "Acclimatisation Advice"],
      },
      {
        name: "Chandragiri Hills Resort",
        location: "Chandragiri, Kathmandu",
        coordinates: { lat: 27.6800, lng: 85.2500 },
        description: "Premium hilltop resort accessible by cable car with sweeping valley views and forest walks",
        contactPhone: "+977-1-5190100",
        email: "info@chandragirishills.com",
        website: "https://chandragirishills.com",
        imageUrl: "https://images.unsplash.com/photo-1584232183330-5f20e8315dd0?w=500",
        rating: 4.5,
        reviewCount: 123,
        amenities: ["Cable Car Access", "Valley View", "Restaurant", "Nature Trails", "Bonfire"],
      },
      {
        name: "Langtang Eco Camp",
        location: "Langtang Village, Langtang Region",
        coordinates: { lat: 28.2115, lng: 85.5412 },
        description: "Sustainable eco-lodge in Langtang Valley built using local stone with solar heating and rainwater harvesting",
        contactPhone: "+977-10-440060",
        email: "camp@langtangecocamp.com",
        website: "https://langtangecocamp.com",
        imageUrl: "https://images.unsplash.com/photo-1537225228614-b19960ecc986?w=500",
        rating: 4.8,
        reviewCount: 167,
        amenities: ["Solar Heating", "Mountain View", "Organic Meals", "Trekking Guides", "Campfire"],
      },
      {
        name: "Chitwan Jungle Villa",
        location: "Sauraha, Chitwan",
        coordinates: { lat: 27.5800, lng: 84.4900 },
        description: "Luxury jungle resort on the edge of Chitwan National Park with elephant safari and canoe rides",
        contactPhone: "+977-56-580200",
        email: "book@chitwanjunglevilla.com",
        website: "https://chitwanjunglevilla.com",
        imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500",
        rating: 4.7,
        reviewCount: 201,
        amenities: ["Safari Package", "Swimming Pool", "Jungle View", "Canoe Rides", "Naturalist Guide"],
      },
      {
        name: "Muktinath Valley Inn",
        location: "Muktinath, Mustang",
        coordinates: { lat: 28.8167, lng: 83.8667 },
        description: "Warm guesthouse near the sacred Muktinath temple at 3710 m with traditional Mustangi hospitality",
        contactPhone: "+977-69-540080",
        email: "stay@muktinathinn.com",
        website: "https://muktinathinn.com",
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500",
        rating: 4.4,
        reviewCount: 88,
        amenities: ["Heated Rooms", "Hot Spring Access", "Restaurant", "Pilgrim Tours", "WiFi"],
      },
    ];

    const createdHotels = [];

    for (const hotelData of hotelsData) {
      const hotel = new Hotel(hotelData);
      await hotel.save();
      createdHotels.push(hotel);
      console.log(`  ✅ Created: ${hotel.name}`);
    }

    // Seed packages for each hotel
    console.log("📦 Seeding hotel packages...");

    const packageConfigs = [
      {
        hotelIndex: 0, // Himalayan Horizon Hotel
        packages: [
          {
            name: "Horizon Standard",
            roomType: "double",
            pricePerNight: 4500,
            capacity: 2,
            availableRooms: 10,
            minStayNights: 1,
            cancellationPolicy: "free",
            amenities: ["Mountain View", "Private Bath", "Hot Water", "WiFi"],
          },
          {
            name: "Panorama Deluxe",
            roomType: "deluxe",
            pricePerNight: 8500,
            capacity: 2,
            availableRooms: 6,
            minStayNights: 1,
            cancellationPolicy: "partial",
            amenities: ["Annapurna View Balcony", "King Bed", "Jacuzzi", "Complimentary Breakfast"],
          },
          {
            name: "Infinity Pool Suite",
            roomType: "suite",
            pricePerNight: 15000,
            capacity: 4,
            availableRooms: 3,
            minStayNights: 2,
            cancellationPolicy: "partial",
            amenities: ["Private Plunge Pool", "Sitting Lounge", "360° Mountain View", "Butler Service"],
          },
        ],
      },
      {
        hotelIndex: 1, // Phewa Pearl Lakeside Resort
        packages: [
          {
            name: "Garden Cottage",
            roomType: "double",
            pricePerNight: 5500,
            capacity: 2,
            availableRooms: 8,
            minStayNights: 1,
            cancellationPolicy: "free",
            amenities: ["Garden Terrace", "Private Bath", "Air Conditioning", "WiFi"],
          },
          {
            name: "Lake View Suite",
            roomType: "suite",
            pricePerNight: 11000,
            capacity: 3,
            availableRooms: 4,
            minStayNights: 2,
            cancellationPolicy: "partial",
            amenities: ["Phewa Lake View", "Balcony", "Jacuzzi", "Free Kayak Rental"],
          },
          {
            name: "Overwater Bungalow",
            roomType: "deluxe",
            pricePerNight: 20000,
            capacity: 2,
            availableRooms: 2,
            minStayNights: 2,
            cancellationPolicy: "non-refundable",
            amenities: ["Overwater Deck", "Glass Floor Panel", "Boat Transfers", "Private Dining"],
          },
        ],
      },
      {
        hotelIndex: 2, // Boudhanath Grand
        packages: [
          {
            name: "Newari Room",
            roomType: "single",
            pricePerNight: 3500,
            capacity: 1,
            availableRooms: 12,
            minStayNights: 1,
            cancellationPolicy: "free",
            amenities: ["Traditional Decor", "Private Bath", "WiFi", "Tea Service"],
          },
          {
            name: "Stupa View Double",
            roomType: "double",
            pricePerNight: 6000,
            capacity: 2,
            availableRooms: 8,
            minStayNights: 1,
            cancellationPolicy: "free",
            amenities: ["Stupa View", "King Bed", "Complimentary Breakfast", "Yoga Mat"],
          },
          {
            name: "Heritage Penthouse",
            roomType: "suite",
            pricePerNight: 13000,
            capacity: 4,
            availableRooms: 2,
            minStayNights: 2,
            cancellationPolicy: "partial",
            amenities: ["Rooftop Terrace", "Panoramic Stupa View", "Private Bar", "Butler Service"],
          },
        ],
      },
      {
        hotelIndex: 3, // Everest Sherpa Lodge
        packages: [
          {
            name: "Sherpa Bunk",
            roomType: "twin",
            pricePerNight: 2000,
            capacity: 2,
            availableRooms: 8,
            minStayNights: 1,
            cancellationPolicy: "free",
            amenities: ["Heated Room", "Shared Bath", "Dal Bhat Dinner"],
          },
          {
            name: "Comfort Double",
            roomType: "double",
            pricePerNight: 4500,
            capacity: 2,
            availableRooms: 5,
            minStayNights: 1,
            cancellationPolicy: "free",
            amenities: ["Electric Blanket", "Hot Shower", "Everest View", "Fresh Bakery Breakfast"],
          },
          {
            name: "Base Camp Suite",
            roomType: "suite",
            pricePerNight: 8000,
            capacity: 4,
            availableRooms: 2,
            minStayNights: 2,
            cancellationPolicy: "partial",
            amenities: ["Attached Bath", "Lounge Area", "Sherpa Guide Briefing", "Gear Drying Room"],
          },
        ],
      },
      {
        hotelIndex: 4, // Chandragiri Hills Resort
        packages: [
          {
            name: "Valley View Room",
            roomType: "double",
            pricePerNight: 4000,
            capacity: 2,
            availableRooms: 9,
            minStayNights: 1,
            cancellationPolicy: "free",
            amenities: ["Valley View", "Private Bath", "Cable Car Ticket", "WiFi"],
          },
          {
            name: "Forest Chalet",
            roomType: "deluxe",
            pricePerNight: 7500,
            capacity: 3,
            availableRooms: 4,
            minStayNights: 1,
            cancellationPolicy: "partial",
            amenities: ["Private Terrace", "Forest Trail Access", "Bonfire", "Breakfast Included"],
          },
        ],
      },
      {
        hotelIndex: 5, // Langtang Eco Camp
        packages: [
          {
            name: "Eco Tent Cabin",
            roomType: "twin",
            pricePerNight: 2800,
            capacity: 2,
            availableRooms: 7,
            minStayNights: 1,
            cancellationPolicy: "free",
            amenities: ["Solar Heating", "Shared Eco-Toilet", "Organic Dinner", "Mountain View"],
          },
          {
            name: "Alpine Stone Room",
            roomType: "double",
            pricePerNight: 5200,
            capacity: 2,
            availableRooms: 4,
            minStayNights: 2,
            cancellationPolicy: "partial",
            amenities: ["Hot Spring Access", "Private Bath", "Campfire", "Glacier View"],
          },
        ],
      },
      {
        hotelIndex: 6, // Chitwan Jungle Villa
        packages: [
          {
            name: "Jungle Deluxe Room",
            roomType: "double",
            pricePerNight: 6500,
            capacity: 2,
            availableRooms: 8,
            minStayNights: 2,
            cancellationPolicy: "partial",
            amenities: ["Jungle View", "Swimming Pool", "Safari Breakfast", "Naturalist Guide"],
          },
          {
            name: "Luxury Tented Suite",
            roomType: "suite",
            pricePerNight: 13500,
            capacity: 4,
            availableRooms: 3,
            minStayNights: 2,
            cancellationPolicy: "partial",
            amenities: ["Private Deck", "Outdoor Shower", "Full Safari Package", "Canoe Ride"],
          },
        ],
      },
      {
        hotelIndex: 7, // Muktinath Valley Inn
        packages: [
          {
            name: "Pilgrim Room",
            roomType: "single",
            pricePerNight: 1800,
            capacity: 1,
            availableRooms: 10,
            minStayNights: 1,
            cancellationPolicy: "free",
            amenities: ["Heated Room", "Dal Bhat Meals", "Hot Water Bottle", "WiFi"],
          },
          {
            name: "Valley View Twin",
            roomType: "twin",
            pricePerNight: 3500,
            capacity: 2,
            availableRooms: 5,
            minStayNights: 1,
            cancellationPolicy: "free",
            amenities: ["Mustang Valley View", "Hot Spring Access", "Private Bath", "Breakfast"],
          },
        ],
      },
    ];

    let totalPackages = 0;
    for (const config of packageConfigs) {
      const hotel = createdHotels[config.hotelIndex];

      for (const pkgData of config.packages) {
        const pkg = new HotelPackage({
          hotelId: hotel._id,
          name: pkgData.name,
          roomType: pkgData.roomType,
          pricePerNight: pkgData.pricePerNight,
          currency: "USD",
          capacity: pkgData.capacity,
          amenities: pkgData.amenities,
          availableRooms: pkgData.availableRooms,
          minStayNights: pkgData.minStayNights,
          cancellationPolicy: pkgData.cancellationPolicy,
        });
        await pkg.save();
        hotel.packages.push(pkg._id);
        totalPackages++;
      }
      await hotel.save();
    }
    console.log(`  ✅ Created ${totalPackages} packages across ${createdHotels.length} hotels`);

    // Seed Hikes
    console.log("🏔️  Seeding hikes...");

    const hikesData = [
      {
        userId: adminUser._id,
        title: "Annapurna Circuit Trek",
        location: "Annapurna Region, Nepal",
        coordinates: { lat: 28.5935, lng: 83.6638 },
        startPoint: { lat: 28.3680, lng: 84.1260 },
        endPoint: { lat: 28.5935, lng: 83.6638 },
        difficulty: 4,
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        spotsLeft: 8,
        imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800",
        description: "One of the world's greatest treks — 230 km circumnavigating the Annapurna massif, crossing Thorong La Pass at 5416 m. Experience diverse landscapes from subtropical forests to high-altitude desert plateaus with panoramic views of Dhaulagiri and Annapurna I.",
        hotels: [createdHotels[0]._id],
      },
      {
        userId: adminUser._id,
        title: "Phewa Lakeside to Sarangkot Sunrise Hike",
        location: "Pokhara, Nepal",
        coordinates: { lat: 28.2178, lng: 83.9633 },
        startPoint: { lat: 28.2043, lng: 83.9854 },
        endPoint: { lat: 28.2178, lng: 83.9633 },
        difficulty: 2,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        spotsLeft: 14,
        imageUrl: "https://images.unsplash.com/photo-1606117331085-5760e3097277?w=800",
        description: "Wake before dawn and hike to Sarangkot Hill at 1600 m for the most iconic sunrise view in Nepal — the entire Annapurna and Dhaulagiri ranges glowing golden against a cobalt sky. Descend back along the lakeside trail for breakfast with a view.",
        hotels: [createdHotels[1]._id],
      },
      {
        userId: adminUser._id,
        title: "Boudhanath Stupa & Kopan Monastery Walk",
        location: "Kathmandu, Nepal",
        coordinates: { lat: 27.7215, lng: 85.3620 },
        startPoint: { lat: 27.7128, lng: 85.3270 },
        endPoint: { lat: 27.7215, lng: 85.3620 },
        difficulty: 1,
        date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        spotsLeft: 18,
        imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800",
        description: "A gentle cultural walk linking UNESCO-listed sites in Kathmandu Valley. Circumambulate the massive Boudhanath Stupa at dawn, stroll through the vibrant Tibetan market, then continue uphill to the peaceful Kopan Monastery with terraced gardens and city views.",
        hotels: [createdHotels[2]._id],
      },
      {
        userId: adminUser._id,
        title: "Everest Base Camp Classic Trek",
        location: "Khumbu, Everest Region",
        coordinates: { lat: 28.0025, lng: 86.8523 },
        startPoint: { lat: 27.8084, lng: 86.7115 },
        endPoint: { lat: 28.0025, lng: 86.8523 },
        difficulty: 5,
        date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        spotsLeft: 6,
        imageUrl: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800",
        description: "The legendary 130 km round-trip trek through the Khumbu valley to the foot of the world's highest mountain at 5364 m. Acclimatise in Namche Bazaar, traverse spectacular Khumbu Glacier moraines, pass Tengboche Monastery, and stand at the foot of Everest.",
        hotels: [createdHotels[3]._id],
      },
      {
        userId: adminUser._id,
        title: "Chandragiri Hills Cable Car & Forest Trail",
        location: "Chandragiri, Kathmandu",
        coordinates: { lat: 27.6800, lng: 85.2500 },
        startPoint: { lat: 27.6900, lng: 85.2600 },
        endPoint: { lat: 27.6800, lng: 85.2500 },
        difficulty: 2,
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        spotsLeft: 20,
        imageUrl: "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800",
        description: "Ride the Chandragiri cable car to 2551 m then hike a forest loop trail through rhododendron groves to Bhaleshwor Mahadev temple. Clear days reward with a jaw-dropping panorama stretching from Langtang Himal to Ganesh Himal and Annapurna.",
        hotels: [createdHotels[4]._id],
      },
      {
        userId: adminUser._id,
        title: "Langtang Valley Glacier Trek",
        location: "Langtang Region, Nepal",
        coordinates: { lat: 28.2115, lng: 85.5412 },
        startPoint: { lat: 28.0700, lng: 85.3400 },
        endPoint: { lat: 28.2115, lng: 85.5412 },
        difficulty: 4,
        date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        spotsLeft: 9,
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
        description: "Trek through the beautiful Langtang Valley — dubbed the 'Valley of Glaciers'. Pass cascading waterfalls, yak pastures, and Tibetan-influenced villages to reach the terminal moraine of Langtang Glacier at 4984 m. Shorter and less crowded than EBC.",
        hotels: [createdHotels[5]._id],
      },
      {
        userId: adminUser._id,
        title: "Chitwan Jungle Canoe & Nature Walk",
        location: "Chitwan National Park, Nepal",
        coordinates: { lat: 27.5400, lng: 84.4200 },
        startPoint: { lat: 27.5800, lng: 84.4900 },
        endPoint: { lat: 27.5400, lng: 84.4200 },
        difficulty: 1,
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        spotsLeft: 16,
        imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800",
        description: "A guided nature walk and dugout canoe ride through the UNESCO World Heritage Chitwan National Park. Spot one-horned rhinoceros, Bengal tigers, gharial crocodiles, and over 500 bird species. Naturalist guides interpret animal tracks and jungle ecology throughout.",
        hotels: [createdHotels[6]._id],
      },
      {
        userId: adminUser._id,
        title: "Muktinath Temple Pilgrimage Trek",
        location: "Mustang, Nepal",
        coordinates: { lat: 28.8167, lng: 83.8667 },
        startPoint: { lat: 28.7400, lng: 83.9200 },
        endPoint: { lat: 28.8167, lng: 83.8667 },
        difficulty: 3,
        date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
        spotsLeft: 11,
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
        description: "Follow an ancient pilgrimage route across the dramatic arid landscape of Upper Mustang to the sacred Muktinath temple at 3710 m — holy to both Hindus and Buddhists. The high-altitude Tibetan plateau scenery with eroded badlands and medieval walled villages is unlike anywhere else.",
        hotels: [createdHotels[7]._id],
      },
    ];

    for (const hikeData of hikesData) {
      const hike = new Hike(hikeData);
      await hike.save();
      console.log(`  ✅ Created: ${hike.title}`);
    }

    // Seed Products
    console.log("🛍️  Seeding products...");
    const productsData = [
      { name: "Osprey Atmos AG 65L", category: "Backpacks", price: 24500, rating: 4.9, reviews: 512, badge: "Best Seller", inStock: true, featured: true,
        img: "https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&w=400",
        images: ["https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&w=800","https://images.pexels.com/photos/2166456/pexels-photo-2166456.jpeg?auto=compress&w=800","https://images.pexels.com/photos/3278215/pexels-photo-3278215.jpeg?auto=compress&w=800","https://images.pexels.com/photos/1271620/pexels-photo-1271620.jpeg?auto=compress&w=800"],
        description: "Award-winning 65 L Anti-Gravity suspension pack weighing 2.07 kg. The mesh trampoline back panel floats the load off your spine and channels air through the entire back. Ideal for multi-day Himalayan treks with heavy food carries." },
      { name: "Deuter Futura Pro 36L", category: "Backpacks", price: 11200, rating: 4.7, reviews: 223, badge: null, inStock: true, featured: false,
        img: "https://images.pexels.com/photos/2385210/pexels-photo-2385210.jpeg?auto=compress&w=400",
        images: ["https://images.pexels.com/photos/2385210/pexels-photo-2385210.jpeg?auto=compress&w=800","https://images.pexels.com/photos/1153369/pexels-photo-1153369.jpeg?auto=compress&w=800","https://images.pexels.com/photos/1271620/pexels-photo-1271620.jpeg?auto=compress&w=800","https://images.pexels.com/photos/2166456/pexels-photo-2166456.jpeg?auto=compress&w=800"],
        description: "Spacious 36 L trekking pack with Aircomfort Vari-Flex back system that self-adjusts to your stride. Generous 26 cm height adjustment range, twin hip-belt pockets, and a separate lower compartment for wet gear." },
      { name: "Gregory Baltoro 75L", category: "Backpacks", price: 23500, rating: 4.8, reviews: 115, badge: "Top Rated", inStock: true, featured: true,
        img: "https://images.pexels.com/photos/2166456/pexels-photo-2166456.jpeg?auto=compress&w=400",
        images: ["https://images.pexels.com/photos/2166456/pexels-photo-2166456.jpeg?auto=compress&w=800","https://images.pexels.com/photos/1271620/pexels-photo-1271620.jpeg?auto=compress&w=800","https://images.pexels.com/photos/2385210/pexels-photo-2385210.jpeg?auto=compress&w=800","https://images.pexels.com/photos/3278215/pexels-photo-3278215.jpeg?auto=compress&w=800"],
        description: "Industry benchmark for load-hauling comfort on extended expeditions. Response A3 hip-belt auto-adjusts with every step. Dual ice-axe loops, a rain cover, and a floating top lid make it fully expedition-ready." },
      { name: "Tortuga Setout 45L Travel Pack", category: "Backpacks", price: 6800, rating: 4.6, reviews: 176, badge: "New", inStock: true, featured: false,
        img: "https://images.pexels.com/photos/3278215/pexels-photo-3278215.jpeg?auto=compress&w=400",
        images: ["https://images.pexels.com/photos/3278215/pexels-photo-3278215.jpeg?auto=compress&w=800","https://images.pexels.com/photos/2385210/pexels-photo-2385210.jpeg?auto=compress&w=800","https://images.pexels.com/photos/1153369/pexels-photo-1153369.jpeg?auto=compress&w=800","https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&w=800"],
        description: "Carry-on compliant 45 L travel pack with a clamshell opening, lockable zippers, and padded laptop sleeve. Hip-belt stows away when not needed. Durable 420D nylon handles monsoon conditions on the trail to Lukla." },
      { name: "Big Agnes Copper Spur HV UL 2P", category: "Camping", price: 32000, rating: 4.9, reviews: 241, badge: "Best Seller", inStock: true, featured: true,
        img: "https://images.pexels.com/photos/1525041/pexels-photo-1525041.jpeg?auto=compress&w=400",
        images: ["https://images.pexels.com/photos/1525041/pexels-photo-1525041.jpeg?auto=compress&w=800","https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&w=800","https://images.pexels.com/photos/1061640/pexels-photo-1061640.jpeg?auto=compress&w=800","https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&w=800"],
        description: "Featherlight freestanding 2-person tent at just 1.06 kg. Hub-and-pole architecture erects in 3 minutes. Dual vestibules provide 1.1 m² of gear storage each. 1500 mm rated fly handles Himalayan rain squalls with ease." },
      { name: "Western Mountaineering Alpinlite 35°F Bag", category: "Camping", price: 18500, rating: 4.8, reviews: 178, badge: null, inStock: true, featured: false,
        img: "https://images.pexels.com/photos/1504557/pexels-photo-1504557.jpeg?auto=compress&w=400",
        images: ["https://images.pexels.com/photos/1504557/pexels-photo-1504557.jpeg?auto=compress&w=800","https://images.pexels.com/photos/1525041/pexels-photo-1525041.jpeg?auto=compress&w=800","https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&w=800","https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&w=800"],
        description: "850-fill power goose down in an ultralight 11 oz body. Comfort rating 2 °C, lower limit -4 °C. Full-length draft collar and anti-snag YKK zipper. The preferred high-altitude sleeping bag on Everest expedition teams." },
      { name: "Jetboil Flash Cooking System", category: "Camping", price: 7800, rating: 4.9, reviews: 334, badge: "Top Rated", inStock: true, featured: false,
        img: "https://images.pexels.com/photos/6271625/pexels-photo-6271625.jpeg?auto=compress&w=400",
        images: ["https://images.pexels.com/photos/6271625/pexels-photo-6271625.jpeg?auto=compress&w=800","https://images.pexels.com/photos/1504557/pexels-photo-1504557.jpeg?auto=compress&w=800","https://images.pexels.com/photos/1525041/pexels-photo-1525041.jpeg?auto=compress&w=800","https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&w=800"],
        description: "All-in-one stove-and-pot system that boils 500 ml in just 100 seconds. Push-button igniter, insulating cozy, and colour-change heat indicator. FluxRing technology is 50 % more fuel efficient than conventional stoves at altitude." },
      { name: "Therm-a-Rest NeoAir XTherm NXT", category: "Camping", price: 13500, rating: 4.7, reviews: 156, badge: null, inStock: true, featured: false,
        img: "https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&w=400",
        images: ["https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&w=800","https://images.pexels.com/photos/1504557/pexels-photo-1504557.jpeg?auto=compress&w=800","https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&w=800","https://images.pexels.com/photos/1525041/pexels-photo-1525041.jpeg?auto=compress&w=800"],
        description: "R-value of 7.3 in a 430 g inflatable pad — the highest warmth-to-weight ratio available. Triangular Core Matrix baffles maximise insulation without bulk. WingLock valve inflates fully in 10 breaths and seals airtight." },
      { name: "Salomon X Ultra 4 Mid GTX", category: "Footwear", price: 13800, rating: 4.8, reviews: 389, badge: "Best Seller", inStock: true, featured: true,
        img: "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&w=400",
        images: ["https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&w=800","https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg?auto=compress&w=800","https://images.pexels.com/photos/1619535/pexels-photo-1619535.jpeg?auto=compress&w=800","https://images.pexels.com/photos/3682215/pexels-photo-3682215.jpeg?auto=compress&w=800"],
        description: "Mid-cut waterproof Gore-Tex membrane boot with reinforced ankle collar. Contagrip MA outsole locks in on wet rocks and muddy switchbacks across Nepal trails. Sensifit cradle wraps the foot for a precision hold on long descent days." },
      { name: "Scarpa Zodiac Plus GTX", category: "Footwear", price: 21500, rating: 4.9, reviews: 108, badge: "Top Rated", inStock: true, featured: false,
        img: "https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg?auto=compress&w=400",
        images: ["https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg?auto=compress&w=800","https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&w=800","https://images.pexels.com/photos/3682215/pexels-photo-3682215.jpeg?auto=compress&w=800","https://images.pexels.com/photos/1619535/pexels-photo-1619535.jpeg?auto=compress&w=800"],
        description: "Technical approach boot with full-grain leather upper and Gore-Tex lining. Vibram Drumlin outsole with Climbing Zone heel provides precise edging on boulder approaches to base camps. Crampon-compatible welt for lightweight glacier travel." },
      { name: "Black Diamond Distance Carbon Z Poles", category: "Footwear", price: 7800, rating: 4.7, reviews: 245, badge: null, inStock: true, featured: false,
        img: "https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&w=400",
        images: ["https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&w=800","https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&w=800","https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg?auto=compress&w=800","https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&w=800"],
        description: "Carbon fibre Z-style folding poles collapsing to just 38 cm. Non-flick FlickLock Pro collar adjusts in seconds even with gloves. Carbide tech tips, EVA cork grip, and interchangeable baskets for all terrain types." },
      { name: "Smartwool PhD Outdoor Heavy Crew Sock", category: "Footwear", price: 2200, rating: 4.7, reviews: 631, badge: "New", inStock: true, featured: false,
        img: "https://images.pexels.com/photos/1619535/pexels-photo-1619535.jpeg?auto=compress&w=400",
        images: ["https://images.pexels.com/photos/1619535/pexels-photo-1619535.jpeg?auto=compress&w=800","https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg?auto=compress&w=800","https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&w=800","https://images.pexels.com/photos/3682215/pexels-photo-3682215.jpeg?auto=compress&w=800"],
        description: "56 % fine Merino wool blend with indestructible Cordura nylon reinforcement at heel and toe. Targeted cushioning zones under ball and arch. Machine-washable with a lifetime guarantee — no questions asked." },
      { name: "DJI Action 5 Pro", category: "Photography", price: 44000, rating: 4.9, reviews: 312, badge: "Best Seller", inStock: true, featured: true,
        img: "https://images.pexels.com/photos/1787235/pexels-photo-1787235.jpeg?auto=compress&w=400",
        images: ["https://images.pexels.com/photos/1787235/pexels-photo-1787235.jpeg?auto=compress&w=800","https://images.pexels.com/photos/243757/pexels-photo-243757.jpeg?auto=compress&w=800","https://images.pexels.com/photos/821652/pexels-photo-821652.jpeg?auto=compress&w=800","https://images.pexels.com/photos/414781/pexels-photo-414781.jpeg?auto=compress&w=800"],
        description: "4K120 slow-motion video and 50 MP stills in a ruggedised body waterproof to 20 m without a case. 10-bit D-Log M colour profile for stunning sunset footage over Annapurna. Magnetic quick-release mount and 3-hour battery life." },
      { name: "Joby GorillaPod 5K Kit", category: "Photography", price: 9800, rating: 4.6, reviews: 189, badge: null, inStock: true, featured: false,
        img: "https://images.pexels.com/photos/243757/pexels-photo-243757.jpeg?auto=compress&w=400",
        images: ["https://images.pexels.com/photos/243757/pexels-photo-243757.jpeg?auto=compress&w=800","https://images.pexels.com/photos/1787235/pexels-photo-1787235.jpeg?auto=compress&w=800","https://images.pexels.com/photos/414781/pexels-photo-414781.jpeg?auto=compress&w=800","https://images.pexels.com/photos/821652/pexels-photo-821652.jpeg?auto=compress&w=800"],
        description: "Flexible tripod supports up to 5 kg and wraps around branches, railings, or uneven rock. Includes quick-release plate, ball head, and GorillaPod phone mount. Folds to 28 cm and weighs just 520 g." },
      { name: "Peak Design Capture Clip V3", category: "Photography", price: 11500, rating: 4.9, reviews: 103, badge: "Top Rated", inStock: true, featured: false,
        img: "https://images.pexels.com/photos/821652/pexels-photo-821652.jpeg?auto=compress&w=400",
        images: ["https://images.pexels.com/photos/821652/pexels-photo-821652.jpeg?auto=compress&w=800","https://images.pexels.com/photos/243757/pexels-photo-243757.jpeg?auto=compress&w=800","https://images.pexels.com/photos/1787235/pexels-photo-1787235.jpeg?auto=compress&w=800","https://images.pexels.com/photos/414781/pexels-photo-414781.jpeg?auto=compress&w=800"],
        description: "Aluminium and stainless steel camera clip mounts to any backpack strap or belt in seconds. One-handed capture and re-attachment in under a second. Arca-Swiss compatible and tested to 45 kg pull strength — trail-proof." },
      { name: "Anker 747 Power Bank 26000mAh", category: "Photography", price: 10500, rating: 4.8, reviews: 467, badge: null, inStock: true, featured: false,
        img: "https://images.pexels.com/photos/414781/pexels-photo-414781.jpeg?auto=compress&w=400",
        images: ["https://images.pexels.com/photos/414781/pexels-photo-414781.jpeg?auto=compress&w=800","https://images.pexels.com/photos/821652/pexels-photo-821652.jpeg?auto=compress&w=800","https://images.pexels.com/photos/243757/pexels-photo-243757.jpeg?auto=compress&w=800","https://images.pexels.com/photos/1787235/pexels-photo-1787235.jpeg?auto=compress&w=800"],
        description: "26000 mAh, 150 W bi-directional GaN charging. Charges a MacBook Pro from 0–80 % in 43 minutes and an iPhone 15 three full times. Three simultaneous outputs. Low-temperature rated to -20 °C for high-altitude use." },
      { name: "Garmin inReach Mini 2", category: "Navigation", price: 45000, rating: 4.9, reviews: 158, badge: "Top Rated", inStock: true, featured: true,
        img: "https://images.pexels.com/photos/3608311/pexels-photo-3608311.jpeg?auto=compress&w=400",
        images: ["https://images.pexels.com/photos/3608311/pexels-photo-3608311.jpeg?auto=compress&w=800","https://images.pexels.com/photos/2365457/pexels-photo-2365457.jpeg?auto=compress&w=800","https://images.pexels.com/photos/346529/pexels-photo-346529.jpeg?auto=compress&w=800","https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&w=800"],
        description: "100 % global Iridium satellite coverage for two-way messaging and triggered SOS even beyond every mobile network. 90 g body pairs with Garmin Explore app for live track-sharing with family at base." },
      { name: "Garmin Fenix 8 Solar", category: "Navigation", price: 72000, rating: 4.9, reviews: 89, badge: "New", inStock: true, featured: true,
        img: "https://images.pexels.com/photos/2365457/pexels-photo-2365457.jpeg?auto=compress&w=400",
        images: ["https://images.pexels.com/photos/2365457/pexels-photo-2365457.jpeg?auto=compress&w=800","https://images.pexels.com/photos/3608311/pexels-photo-3608311.jpeg?auto=compress&w=800","https://images.pexels.com/photos/346529/pexels-photo-346529.jpeg?auto=compress&w=800","https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&w=800"],
        description: "Multi-band GPS smartwatch with solar charging, sapphire lens, and titanium bezel. Barometric altimeter, storm alarm, and preloaded TopoActive Nepal maps. Up to 428 hours GPS battery life — outlasts the longest EBC itineraries." },
      { name: "Suunto A-30 Field Compass", category: "Navigation", price: 2800, rating: 4.5, reviews: 342, badge: null, inStock: true, featured: false,
        img: "https://images.pexels.com/photos/346529/pexels-photo-346529.jpeg?auto=compress&w=400",
        images: ["https://images.pexels.com/photos/346529/pexels-photo-346529.jpeg?auto=compress&w=800","https://images.pexels.com/photos/3608311/pexels-photo-3608311.jpeg?auto=compress&w=800","https://images.pexels.com/photos/2365457/pexels-photo-2365457.jpeg?auto=compress&w=800","https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&w=800"],
        description: "Liquid-filled baseplate compass with a built-in clinometer and 1:25000 map scale. Global needle works across all latitudes without tilting. Luminous bezel markings for night navigation — essential backup for any trek." },
      { name: "Garmin GPSMAP 67i", category: "Navigation", price: 71000, rating: 4.9, reviews: 63, badge: "Best Seller", inStock: true, featured: false,
        img: "https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&w=400",
        images: ["https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&w=800","https://images.pexels.com/photos/3608311/pexels-photo-3608311.jpeg?auto=compress&w=800","https://images.pexels.com/photos/346529/pexels-photo-346529.jpeg?auto=compress&w=800","https://images.pexels.com/photos/2365457/pexels-photo-2365457.jpeg?auto=compress&w=800"],
        description: "Rugged handheld GPS with built-in inReach satellite messaging and SOS, 2.7-inch sunlight-readable display, and 36-hour battery. Preloaded TopoActive Nepal maps at 1:24000 resolution with hill shading." },
      { name: "Adventure Medical Kits Mountain Series 2.0", category: "Safety", price: 6500, rating: 4.8, reviews: 267, badge: "Best Seller", inStock: true, featured: false,
        img: "https://images.pexels.com/photos/3735747/pexels-photo-3735747.jpeg?auto=compress&w=400",
        images: ["https://images.pexels.com/photos/3735747/pexels-photo-3735747.jpeg?auto=compress&w=800","https://images.pexels.com/photos/1061640/pexels-photo-1061640.jpeg?auto=compress&w=800","https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&w=800","https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&w=800"],
        description: "250+ medical supplies for 4 people over 14 days. Includes SAM splint, blister prevention kit, QuikClot haemostatic gauze, altitude sickness guide, and hypothermia protocol cards. Roll-top waterproof bag, 690 g." },
      { name: "Petzl Actik Core 600lm Headlamp", category: "Safety", price: 3800, rating: 4.8, reviews: 534, badge: null, inStock: true, featured: false,
        img: "https://images.pexels.com/photos/1061640/pexels-photo-1061640.jpeg?auto=compress&w=400",
        images: ["https://images.pexels.com/photos/1061640/pexels-photo-1061640.jpeg?auto=compress&w=800","https://images.pexels.com/photos/3735747/pexels-photo-3735747.jpeg?auto=compress&w=800","https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&w=800","https://images.pexels.com/photos/1504557/pexels-photo-1504557.jpeg?auto=compress&w=800"],
        description: "600-lumen rechargeable headlamp with white and red lighting modes. REACTIVE LIGHTING technology automatically adjusts brightness to ambient light. IPX4 rated and accepts AAA batteries as backup when the core is depleted." },
      { name: "SOL Escape Pro Bivvy", category: "Safety", price: 3100, rating: 4.6, reviews: 358, badge: null, inStock: true, featured: false,
        img: "https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&w=400",
        images: ["https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&w=800","https://images.pexels.com/photos/1061640/pexels-photo-1061640.jpeg?auto=compress&w=800","https://images.pexels.com/photos/3735747/pexels-photo-3735747.jpeg?auto=compress&w=800","https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&w=800"],
        description: "Breathable aluminised shell reflects 80 % of radiated body heat while allowing moisture vapour to escape. Fits one adult with full sleeping bag clearance. Stuffs to fist size at 260 g with a built-in hood drawcord." },
      { name: "UST Blaze & Reflect Combo Kit", category: "Safety", price: 1150, rating: 4.5, reviews: 714, badge: "New", inStock: true, featured: false,
        img: "https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&w=400",
        images: ["https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&w=800","https://images.pexels.com/photos/3735747/pexels-photo-3735747.jpeg?auto=compress&w=800","https://images.pexels.com/photos/1061640/pexels-photo-1061640.jpeg?auto=compress&w=800","https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&w=800"],
        description: "120 dB pealess whistle audible over 2.5 km, paired with a military-spec acrylic signal mirror visible to search aircraft beyond 16 km. Combo clips to a locking carabiner — just 22 g of life-saving emergency signalling." },
    ];
    const createdProducts = await Product.insertMany(productsData);
    console.log(`  ✅ Created ${createdProducts.length} products`);

    console.log("\n✨ Database seeding completed successfully!");
    console.log(`Users created: 1 (${adminUser.email})`);
    console.log(`Total hotels created: ${createdHotels.length}`);
    console.log(`Total packages created: ${totalPackages}`);
    console.log(`Total hikes created: ${hikesData.length}`);
    console.log(`Total products created: ${createdProducts.length}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
}

seedDatabase();
