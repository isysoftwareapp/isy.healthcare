/**
 * Script to reset all services and reassign them to the correct clinic
 * Run with: npx tsx scripts/reset-services-clinic.ts
 */

import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";

const CLINIC_ID = "690ce7b67fcb959fac32a03d"; // ISY Healthcare Main Clinic

interface Service {
  _id: mongoose.Types.ObjectId;
  serviceId: string;
  serviceName: string;
  category: string;
  description: string;
  pricing: {
    local: number;
    localWithInsurance: number;
    tourist: number;
    touristWithInsurance: number;
  };
  isActive: boolean;
  assignedClinic: mongoose.Types.ObjectId;
}

const ServiceSchema = new mongoose.Schema({
  serviceId: String,
  serviceName: String,
  category: String,
  description: String,
  pricing: {
    local: Number,
    localWithInsurance: Number,
    tourist: Number,
    touristWithInsurance: Number,
  },
  isActive: Boolean,
  assignedClinic: mongoose.Types.ObjectId,
  serviceCode: String,
  unit: String,
  estimatedDuration: Number,
  requiresDoctor: Boolean,
  requiresEquipment: [String],
  notes: String,
});

const Service =
  mongoose.models.Service || mongoose.model<Service>("Service", ServiceSchema);

async function resetServicesClinic() {
  try {
    console.log("🔌 Connecting to database...");
    await connectDB();

    console.log("🔍 Finding all services...");
    const services = await Service.find({});
    console.log(`📊 Found ${services.length} services`);

    if (services.length === 0) {
      console.log("⚠️  No services found. Nothing to update.");
      return;
    }

    console.log(`🔄 Updating all services to clinic: ${CLINIC_ID}`);
    const result = await Service.updateMany(
      {},
      {
        $set: {
          assignedClinic: new mongoose.Types.ObjectId(CLINIC_ID),
        },
      }
    );

    console.log(`✅ Successfully updated ${result.modifiedCount} services`);

    // Verify the update
    console.log("🔍 Verifying update...");
    const updatedServices = await Service.find({
      assignedClinic: new mongoose.Types.ObjectId(CLINIC_ID),
    });
    console.log(`✅ ${updatedServices.length} services now assigned to clinic`);

    // Show sample
    if (updatedServices.length > 0) {
      console.log("\n📋 Sample updated service:");
      const sample = updatedServices[0];
      console.log({
        serviceId: sample.serviceId,
        serviceName: sample.serviceName,
        assignedClinic: sample.assignedClinic,
      });
    }

    console.log("\n✨ Done!");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

resetServicesClinic();
