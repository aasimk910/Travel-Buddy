// Direct database seeding script
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

dotenv.config();

const User = require("./models/User");
const Hotel = require("./models/Hotel");
const HotelPackage = require("./models/HotelPackage");
const Hike = require("./models/Hike");

const MONGO_URI = process.env.MONGO_URI;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME;

async function seedDatabase() {
  try {
    const connectOptions = {};
    if (!MONGO_URI.includes("travelbuddy")) {
      connectOptions.dbName = MONGO_DB_NAME || "travelbuddy";
    }

    await mongoose.connect(MONGO_URI, connectOptions);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    console.log("🧹 Clearing existing data...");
    await User.deleteMany({});
    await Hotel.deleteMany({});
    await HotelPackage.deleteMany({});
    await Hike.deleteMany({});

    // Create a dummy admin user for hikes
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
        name: "Annapurna View Lodge",
        location: "Pokhara, Nepal",
        coordinates: { lat: 28.2096, lng: 83.9856 },
        description: "Beautiful lodge with stunning views of the Annapurna Range",
        contactPhone: "+977-61-520000",
        email: "contact@annapurnaview.com",
        website: "https://annapurnaview.com",
        imageUrl: "https://images.unsplash.com/photo-1566658529124-3be32fe00c94?w=500",
        rating: 4.8,
        reviewCount: 156,
        amenities: ["WiFi", "Restaurant", "Mountain View", "Parking", "Spa", "Garden"],
      },
      {
        name: "Lakeside Resort",
        location: "Pokhara, Nepal",
        coordinates: { lat: 28.2043, lng: 83.9854 },
        description: "Luxury resort right on the banks of Phewa Lake",
        contactPhone: "+977-61-465000",
        email: "info@lakesideresort.com",
        website: "https://lakesideresort.com",
        imageUrl: "https://images.unsplash.com/photo-1571003123894-169987b86f0d?w=500",
        rating: 4.6,
        reviewCount: 98,
        amenities: ["WiFi", "Swimming Pool", "Lake View", "Restaurant", "Bar", "Beach"],
      },
      {
        name: "Kathmandu Heritage Hotel",
        location: "Kathmandu, Nepal",
        coordinates: { lat: 27.7128, lng: 85.327 },
        description: "Historic hotel in the heart of Kathmandu with traditional architecture",
        contactPhone: "+977-1-4470000",
        email: "stay@ktmheritage.com",
        website: "https://ktmheritage.com",
        imageUrl: "https://images.unsplash.com/photo-1580828343991-fd09a7c0bfa0?w=500",
        rating: 4.4,
        reviewCount: 234,
        amenities: ["WiFi", "Restaurant", "Cultural Tours", "Rooftop Terrace", "Library"],
      },
      {
        name: "Mountain Peak Inn",
        location: "Namche Bazaar, Everest Region",
        coordinates: { lat: 27.8084, lng: 86.7115 },
        description: "Cozy inn with electric heaters and hot showers in the Everest region",
        contactPhone: "+977-3-380088",
        email: "peaks@mountaininn.com",
        website: "https://mountainpeakinn.com",
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500",
        rating: 4.5,
        reviewCount: 167,
        amenities: ["Fireplace", "Hot Shower", "Healer Service", "Restaurant", "Local Guides"],
      },
      {
        name: "Dhulikhel Garden Hotel",
        location: "Dhulikhel, Kavre",
        coordinates: { lat: 27.6218, lng: 85.4152 },
        description: "Peaceful garden hotel perfect for day hikes from Kathmandu",
        contactPhone: "+977-11-490100",
        email: "gardens@dhulikhel.com",
        website: "https://dhulikhel-hotel.com",
        imageUrl: "https://images.unsplash.com/photo-1584232183330-5f20e8315dd0?w=500",
        rating: 4.3,
        reviewCount: 89,
        amenities: ["WiFi", "Garden", "Restaurant", "Ayurveda Spa", "Terrace"],
      },
      {
        name: "Langtang Valley Retreat",
        location: "Langtang Region",
        coordinates: { lat: 28.1647, lng: 85.5127 },
        description: "Mountain retreat with traditional Nepali hospitality",
        contactPhone: "+977-10-430040",
        email: "info@langtangretreat.com",
        website: "https://langtangretreat.com",
        imageUrl: "https://images.unsplash.com/photo-1537225228614-b19960ecc986?w=500",
        rating: 4.7,
        reviewCount: 145,
        amenities: ["Mountain View", "Hot Water", "Restaurant", "Hiking Guides", "Bonfire"],
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
        hotelIndex: 0, // Annapurna View Lodge
        packages: [
          {
            name: "Standard Room",
            roomType: "double",
            pricePerNight: 60,
            capacity: 2,
            availableRooms: 8,
            minStayNights: 1,
            cancellationPolicy: "free",
            amenities: ["Private Bath", "Hot Water", "Mountain View"],
          },
          {
            name: "Deluxe Suite",
            roomType: "suite",
            pricePerNight: 120,
            capacity: 4,
            availableRooms: 4,
            minStayNights: 1,
            cancellationPolicy: "partial",
            amenities: ["Private Bath", "Balcony", "Mountain View", "Sitting Area"],
          },
        ],
      },
      {
        hotelIndex: 1, // Lakeside Resort
        packages: [
          {
            name: "Lake View Room",
            roomType: "double",
            pricePerNight: 80,
            capacity: 2,
            availableRooms: 6,
            minStayNights: 1,
            cancellationPolicy: "free",
            amenities: ["Lake View", "Private Bath", "Air Conditioning"],
          },
          {
            name: "Premium Suite",
            roomType: "suite",
            pricePerNight: 150,
            capacity: 4,
            availableRooms: 3,
            minStayNights: 2,
            cancellationPolicy: "partial",
            amenities: ["Lake View", "Jacuzzi", "Balcony", "Private Pool Access"],
          },
          {
            name: "Luxury Villa",
            roomType: "deluxe",
            pricePerNight: 200,
            capacity: 6,
            availableRooms: 2,
            minStayNights: 3,
            cancellationPolicy: "non-refundable",
            amenities: ["Private Villa", "Pool", "Chef Service", "Lake Access"],
          },
        ],
      },
      {
        hotelIndex: 2, // Kathmandu Heritage Hotel
        packages: [
          {
            name: "Heritage Room",
            roomType: "single",
            pricePerNight: 45,
            capacity: 1,
            availableRooms: 10,
            minStayNights: 1,
            cancellationPolicy: "free",
            amenities: ["Traditional Decor", "Private Bath", "WiFi"],
          },
          {
            name: "Double Heritage",
            roomType: "double",
            pricePerNight: 70,
            capacity: 2,
            availableRooms: 8,
            minStayNights: 1,
            cancellationPolicy: "free",
            amenities: ["Traditional Decor", "Private Bath", "City View"],
          },
        ],
      },
      {
        hotelIndex: 3, // Mountain Peak Inn
        packages: [
          {
            name: "Standard Twin",
            roomType: "twin",
            pricePerNight: 50,
            capacity: 2,
            availableRooms: 5,
            minStayNights: 1,
            cancellationPolicy: "free",
            amenities: ["Heater", "Hot Shower", "Mountain View"],
          },
          {
            name: "Deluxe Double",
            roomType: "double",
            pricePerNight: 85,
            capacity: 2,
            availableRooms: 3,
            minStayNights: 1,
            cancellationPolicy: "partial",
            amenities: ["Heater", "Attached Bath", "Balcony"],
          },
        ],
      },
      {
        hotelIndex: 4, // Dhulikhel Garden Hotel
        packages: [
          {
            name: "Garden View",
            roomType: "double",
            pricePerNight: 55,
            capacity: 2,
            availableRooms: 7,
            minStayNights: 1,
            cancellationPolicy: "free",
            amenities: ["Garden View", "Private Bath", "Terrace Access"],
          },
          {
            name: "Suite with Spa",
            roomType: "suite",
            pricePerNight: 95,
            capacity: 3,
            availableRooms: 2,
            minStayNights: 1,
            cancellationPolicy: "partial",
            amenities: ["Spa Access", "Garden View", "Sitting Area"],
          },
        ],
      },
      {
        hotelIndex: 5, // Langtang Valley Retreat
        packages: [
          {
            name: "Mountain Room",
            roomType: "double",
            pricePerNight: 65,
            capacity: 2,
            availableRooms: 6,
            minStayNights: 1,
            cancellationPolicy: "free",
            amenities: ["Mountain View", "Hot Water", "Fireplace"],
          },
          {
            name: "Alpine Suite",
            roomType: "suite",
            pricePerNight: 110,
            capacity: 4,
            availableRooms: 3,
            minStayNights: 2,
            cancellationPolicy: "partial",
            amenities: ["Mountain View", "Fireplace", "Hot Spring Access", "Balcony"],
          },
        ],
      },
    ];

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
      }
      await hotel.save();
    }
    console.log("  ✅ Created 17 packages across 6 hotels");

    // Seed Hikes
    console.log("🏔️  Seeding hikes...");

    const hikesData = [
      {
        userId: adminUser._id,
        title: "Annapurna Base Camp Trek",
        location: "Annapurna Region",
        coordinates: { lat: 28.5935, lng: 83.6638 },
        startPoint: { lat: 28.1936, lng: 83.8876 },
        endPoint: { lat: 28.5935, lng: 83.6638 },
        difficulty: 4,
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        spotsLeft: 8,
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
        description: "A stunning trek through the Annapurna mountains with breathtaking views and diverse landscapes. Perfect for experienced hikers.",
        hotels: [createdHotels[0]._id], // Annapurna View Lodge
      },
      {
        userId: adminUser._id,
        title: "Phewa Lake Scenic Hike",
        location: "Pokhara, Nepal",
        coordinates: { lat: 28.2096, lng: 83.9856 },
        startPoint: { lat: 28.2043, lng: 83.9854 },
        endPoint: { lat: 28.2200, lng: 83.9700 },
        difficulty: 2,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        spotsLeft: 12,
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
        description: "Easy and relaxing hike around the beautiful Phewa Lake in Pokhara with great restaurants and view points.",
        hotels: [createdHotels[1]._id], // Lakeside Resort
      },
      {
        userId: adminUser._id,
        title: "Kathmandu Valley Heritage Walk",
        location: "Kathmandu, Nepal",
        coordinates: { lat: 27.7128, lng: 85.327 },
        startPoint: { lat: 27.7128, lng: 85.327 },
        endPoint: { lat: 27.7200, lng: 85.3350 },
        difficulty: 1,
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        spotsLeft: 15,
        imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800",
        description: "Explore the historic sites of Kathmandu Valley including temples, monasteries, and ancient architecture.",
        hotels: [createdHotels[2]._id], // Kathmandu Heritage Hotel
      },
      {
        userId: adminUser._id,
        title: "Everest Base Camp Trek",
        location: "Everest Region",
        coordinates: { lat: 28.0425, lng: 86.8859 },
        startPoint: { lat: 27.8084, lng: 86.7115 },
        endPoint: { lat: 28.0425, lng: 86.8859 },
        difficulty: 5,
        date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        spotsLeft: 6,
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
        description: "The ultimate high altitude trek to the base camp of Mount Everest. Experience the majesty of the world's highest peak.",
        hotels: [createdHotels[3]._id], // Mountain Peak Inn
      },
      {
        userId: adminUser._id,
        title: "Namobuddha Spiritual Trek",
        location: "Kavre, Nepal",
        coordinates: { lat: 27.6218, lng: 85.4152 },
        startPoint: { lat: 27.6218, lng: 85.4152 },
        endPoint: { lat: 27.6350, lng: 85.4280 },
        difficulty: 2,
        date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        spotsLeft: 10,
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
        description: "A spiritual trek to the sacred Namobuddha temple with a mix of religious heritage and natural beauty.",
        hotels: [createdHotels[4]._id, createdHotels[5]._id], // Dhulikhel & Langtang
      },
    ];

    for (const hikeData of hikesData) {
      const hike = new Hike(hikeData);
      await hike.save();
      console.log(`  ✅ Created: ${hike.title}`);
    }

    console.log("\n✨ Database seeding completed successfully!");
    console.log(`Users created: 1 (${adminUser.email})`);
    console.log(`Total hotels created: ${createdHotels.length}`);
    console.log(`Total packages created: 17`);
    console.log(`Total hikes created: ${hikesData.length}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
}

seedDatabase();
