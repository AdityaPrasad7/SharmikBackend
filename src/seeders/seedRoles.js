import { Role } from "../models/role/role.model.js";

export const seedRoles = async () => {
  const defaultRoles = [
    {
      name: "Job Seeker",
      value: "job-seeker",
      label: "Job Seeker",
      description: "Find your next career opportunity and apply with ease, connecting with top employers.",
      icon: "briefcase",
      registrationPath: "/api/job-seekers",
      status: "Active",
    },
    {
      name: "Recruiter",
      value: "recruiter",
      label: "Recruiter",
      description: "Discover top talent, post new jobs efficiently, and manage applicants seamlessly.",
      icon: "phone",
      registrationPath: "/api/recruiters",
      status: "Active",
    },
  ];

  for (const roleData of defaultRoles) {
    const existingRole = await Role.findOne({ value: roleData.value });

    if (!existingRole) {
      await Role.create(roleData);
      console.log(`✅ Role created: ${roleData.name}`);
    } else {
      // Update if description, icon, registrationPath, or status changed
      let shouldUpdate = false;

      if (existingRole.description !== roleData.description) {
        existingRole.description = roleData.description;
        shouldUpdate = true;
      }

      if (existingRole.icon !== roleData.icon) {
        existingRole.icon = roleData.icon;
        shouldUpdate = true;
      }

      if (existingRole.registrationPath !== roleData.registrationPath) {
        existingRole.registrationPath = roleData.registrationPath;
        shouldUpdate = true;
      }

      if (existingRole.status !== roleData.status) {
        existingRole.status = roleData.status;
        shouldUpdate = true;
      }

      if (shouldUpdate) {
        await existingRole.save();
        console.log(`ℹ️ Role updated: ${roleData.name}`);
      }
    }
  }

  const allRoles = await Role.find({});
  if (allRoles.length === defaultRoles.length) {
    console.log("ℹ️ All roles are already present");
  }
};

