import { Category } from "../models/category/category.model.js";

export const seedCategories = async () => {
  const defaultCategories = [
    {
      name: "Non-Degree Holder",
      description: "Focus on practical skills & experience",
      status: "Active",
    },
    {
      name: "Diploma Holder",
      description: "Technical education diploma certified",
      status: "Active",
    },
    {
      name: "ITI Holder",
      description: "Industrial Training Institute qualified",
      status: "Active",
    },
  ];

  for (const categoryData of defaultCategories) {
    const existingCategory = await Category.findOne({ name: categoryData.name });

    if (!existingCategory) {
      await Category.create(categoryData);
      console.log(`✅ Category created: ${categoryData.name}`);
    } else {
      // Update if description or status changed
      let shouldUpdate = false;

      if (existingCategory.description !== categoryData.description) {
        existingCategory.description = categoryData.description;
        shouldUpdate = true;
      }

      if (existingCategory.status !== categoryData.status) {
        existingCategory.status = categoryData.status;
        shouldUpdate = true;
      }

      if (shouldUpdate) {
        await existingCategory.save();
        console.log(`ℹ️ Category updated: ${categoryData.name}`);
      }
    }
  }

  const allCategories = await Category.find({});
  if (allCategories.length === defaultCategories.length) {
    console.log("ℹ️ All categories are already present");
  }
};

