import { seedDefaultAdmin } from "./src/seeders/seedAdmin.js";
import { seedCategories } from "./src/seeders/seedCategories.js";
import { seedRoles } from "./src/seeders/seedRoles.js";
import { seedStatesAndCities } from "./src/seeders/seedStatesAndCities.js";
import { seedJobMeta } from "./src/seeders/seedJobMeta.js";
import connectDB from "./src/config/db.js";

async function initializeDB() {
  await connectDB();

  // Seed only ONCE
  await seedDefaultAdmin();
  await seedCategories();
  await seedRoles();
  await seedStatesAndCities();
  await seedJobMeta();
  console.log("Database Seed Complete!");
}
initializeDB();
