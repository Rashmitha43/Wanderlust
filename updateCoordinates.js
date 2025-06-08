const mongoose = require("mongoose");
const axios = require("axios");
const Listing = require("./models/listing.js"); // Adjust the path to your Listing model

const mapboxToken="<%=process.env.MAP_TOKEN%>";

async function connectDB() {
  await mongoose.connect("mongodb://127.0.0.1:27017/your-db-name", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("Database connected");
}

async function updateCoordinates() {
  const listings = await Listing.find({}); // Fetch all listings

  for (let listing of listings) {
    // Skip if already has coordinates
    if (listing.geometry && listing.geometry.coordinates.length === 2) continue;

    const locationQuery = `${listing.location}, ${listing.country}`;
    try {
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationQuery)}.json`,
        {
          params: {
            access_token: mapboxToken,
            limit: 1,
          },
        }
      );

      if (response.data.features.length === 0) {
        console.warn(`No results for: ${locationQuery}`);
        continue;
      }

      const [lng, lat] = response.data.features[0].center;

      listing.geometry = {
        type: "Point",
        coordinates: [lng, lat],
      };

      await listing.save();
      console.log(`Updated: ${listing.title} → ${listing.geometry.coordinates}`);
    } catch (err) {
      console.error(`Error updating ${listing.title}:`, err.message);
    }
  }

  console.log("Finished updating listings.");
  mongoose.connection.close();
}

connectDB().then(updateCoordinates);
