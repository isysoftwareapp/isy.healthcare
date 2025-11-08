/**
 * Database Initialization Script
 * Run this script to seed the database with initial data
 * Usage: node --loader ts-node/esm scripts/init-db.ts
 */

import { seedDatabase, clearDatabase } from "../lib/seed";

async function main() {
  const args = process.argv.slice(2);
  const shouldClear = args.includes("--clear");

  try {
    if (shouldClear) {
      console.log("⚠️  Clearing database...");
      const confirm = process.env.CONFIRM_CLEAR === "yes";

      if (!confirm) {
        console.error(
          "❌ Database clear cancelled. Set CONFIRM_CLEAR=yes to proceed."
        );
        process.exit(1);
      }

      await clearDatabase();
    }

    await seedDatabase();

    console.log("\n✅ Database initialization complete!");
    console.log("\n📝 Default credentials:");
    console.log("   Email: admin@clinic.com");
    console.log("   Password: admin123");
    console.log("\n⚠️  Please change the default password immediately!\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    process.exit(1);
  }
}

main();
