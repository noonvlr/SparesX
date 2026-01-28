#!/usr/bin/env node
/**
 * Check which database is being used
 */

const mongoose = require("mongoose");

async function checkDatabase() {
  try {
    const uri = process.env.MONGODB_URI;
    console.log("Connecting to:", uri.replace(/:[^:]*@/, ":****@"));

    const conn = await mongoose.connect(uri);
    
    const dbName = conn.connection.db.databaseName;
    console.log(`\n✓ Connected to database: "${dbName}"`);

    // List all collections
    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`\nCollections in "${dbName}":`);
    collections.forEach((col, i) => {
      console.log(`  ${i + 1}. ${col.name}`);
    });

    await conn.disconnect();
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

checkDatabase();
