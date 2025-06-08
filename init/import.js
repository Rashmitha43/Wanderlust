if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const { MongoClient, ObjectId } = require("mongodb");  // Import ObjectId
const { data } = require("./data.js"); // Your array of listings

const uri = process.env.ATLASDB_URL;
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();

    const db = client.db("test"); // Replace with your DB name if different
    const collection = db.collection("listings");

    // Step 1: Delete all existing documents
    const deleteResult = await collection.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} existing listings.`);

    // Step 2: Add owner field to all listings before inserting
    const ownerId = new ObjectId("684565949fec74ff9b591b7c");  // your owner ObjectId

    const dataWithOwner = data.map(item => ({
      ...item,
      owner: ownerId
    }));

    // Step 3: Insert new data with owner field
    const insertResult = await collection.insertMany(dataWithOwner);
    console.log(`Successfully inserted ${insertResult.insertedCount} new listings!`);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.close();
  }
}

run();
