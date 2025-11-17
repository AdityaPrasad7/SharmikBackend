import { JobMeta } from "../models/recruiter/jobPost/jobMeta.model.js";

/**
 * Seed Job Meta Data
 * Populates job categories, job types, and facilities for recruiter job postings
 * This is a singleton - only one document will exist
 */
export const seedJobMeta = async () => {
  try {
    // Check if job meta already exists
    const existingJobMeta = await JobMeta.findOne();

    if (existingJobMeta) {
      console.log("✅ Job Meta data already exists. Skipping seed.");
      return;
    }

    // Create initial job meta data
    const jobMetaData = {
      jobCategories: [
        {
          name: "Physical Work",
          order: 1,
          status: "Active",
        },
        {
          name: "Semi-Physical",
          order: 2,
          status: "Active",
        },
        {
          name: "Auto",
          order: 3,
          status: "Active",
        },
      ],

      jobTypes: [
        {
          name: "Full Time",
          order: 1,
          status: "Active",
        },
        {
          name: "Part Time",
          order: 2,
          status: "Active",
        },
        {
          name: "Contract Based",
          order: 3,
          status: "Active",
        },
      ],

      facilities: [
        {
          key: "foodProvided",
          label: "Food Provided",
          order: 1,
          status: "Active",
        },
        {
          key: "accommodationProvided",
          label: "Accommodation Provided",
          order: 2,
          status: "Active",
        },
        {
          key: "travelFacility",
          label: "Travel Facility",
          order: 3,
          status: "Active",
        },
      ],
    };

    // Create the job meta document
    const jobMeta = await JobMeta.create(jobMetaData);

    console.log("✅ Job Meta data seeded successfully!");
    console.log(`   - Job Categories: ${jobMeta.jobCategories.length}`);
    console.log(`   - Job Types: ${jobMeta.jobTypes.length}`);
    console.log(`   - Facilities: ${jobMeta.facilities.length}`);

    return jobMeta;
  } catch (error) {
    console.error("❌ Error seeding Job Meta data:", error);
    throw error;
  }
};

