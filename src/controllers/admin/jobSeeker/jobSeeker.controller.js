import { JobSeeker } from "../../../models/jobSeeker/jobSeeker.model.js";
import { Application } from "../../../models/jobSeeker/application.model.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";

/**
 * Helper: Parse date range from query params
 */
const parseDateRange = (query) => {
    const { startDate, endDate } = query;

    let start = null;
    let end = null;

    if (startDate) {
        start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
    }

    if (endDate) {
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
    }

    return { startDate: start, endDate: end };
};

/**
 * Helper: Build date filter for MongoDB queries
 */
const buildDateFilter = (startDate, endDate, field = "createdAt") => {
    if (!startDate && !endDate) return {};

    const filter = {};
    if (startDate && endDate) {
        filter[field] = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
        filter[field] = { $gte: startDate };
    } else if (endDate) {
        filter[field] = { $lte: endDate };
    }

    return filter;
};

/**
 * Get Job Seeker Insights Stats
 * Returns Active Profiles, Interviews Scheduled, Offers Extended, Skills Verified
 * 
 * Query params:
 * - startDate: ISO date string
 * - endDate: ISO date string
 */
export const getJobSeekerStats = asyncHandler(async (req, res) => {
    const { startDate, endDate } = parseDateRange(req.query);
    const dateFilter = buildDateFilter(startDate, endDate);

    // Calculate timestamps for growth metrics
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Build base queries
    const activeProfileQuery = { status: "Active", isRegistrationComplete: true, ...dateFilter };

    // Get all stats in parallel
    const [
        activeProfiles,
        activeProfilesLastWeek,
        shortlistedApplications,  // Using "Shortlisted" as interview indicator
        offersExtended,           // Count of applications with status tracking
        skillsVerifiedCount,      // Job seekers with skills updated in last 30 days
        totalRecruitersWithShortlisted
    ] = await Promise.all([
        // Active Profiles
        JobSeeker.countDocuments(activeProfileQuery),

        // Active profiles last week (for growth calculation)
        JobSeeker.countDocuments({
            status: "Active",
            isRegistrationComplete: true,
            createdAt: { $lt: oneWeekAgo },
            ...dateFilter
        }),

        // Interviews Scheduled (Shortlisted applications)
        Application.countDocuments({
            status: "Shortlisted",
            ...dateFilter
        }),

        // Offers Extended (we'll track as applications that progressed)
        Application.countDocuments({
            status: { $in: ["Shortlisted"] },
            ...dateFilter
        }),

        // Skills Verified (Job seekers with selectedSkills who updated recently)
        JobSeeker.countDocuments({
            status: "Active",
            selectedSkills: { $exists: true, $ne: [] },
            updatedAt: { $gte: thirtyDaysAgo },
            ...dateFilter
        }),

        // Count distinct recruiters with shortlisted applications (for "across X recruiters")
        Application.aggregate([
            { $match: { status: "Shortlisted", ...dateFilter } },
            {
                $lookup: {
                    from: "recruiterjobs",
                    localField: "job",
                    foreignField: "_id",
                    as: "jobDetails"
                }
            },
            { $unwind: "$jobDetails" },
            { $group: { _id: "$jobDetails.recruiter" } },
            { $count: "total" }
        ])
    ]);

    // Calculate growth
    const weekGrowth = activeProfilesLastWeek > 0
        ? activeProfiles - activeProfilesLastWeek
        : activeProfiles;

    const recruitersCount = totalRecruitersWithShortlisted[0]?.total || 0;

    // Calculate conversion rate (shortlisted/total applications)
    const totalApplications = await Application.countDocuments(dateFilter);
    const conversionRate = totalApplications > 0
        ? ((shortlistedApplications / totalApplications) * 100).toFixed(1)
        : 0;

    return res.status(200).json(
        ApiResponse.success(
            {
                stats: {
                    activeProfiles: {
                        count: activeProfiles,
                        growth: weekGrowth,
                        growthLabel: weekGrowth >= 0 ? `+${weekGrowth} this week` : `${weekGrowth} this week`,
                    },
                    interviewsScheduled: {
                        count: shortlistedApplications,
                        subLabel: `Across ${recruitersCount} recruiters`,
                    },
                    offersExtended: {
                        count: offersExtended,
                        growth: parseFloat(conversionRate),
                        growthLabel: `+${conversionRate}% conversion`,
                    },
                    skillsVerified: {
                        count: skillsVerifiedCount,
                        subLabel: "Updated in last 30 days",
                    },
                },
                dateRange: startDate && endDate ? { startDate, endDate } : null,
            },
            "Job seeker stats fetched successfully"
        )
    );
});

/**
 * Get Top Job Seekers
 * Returns high-intent candidates with their details and status
 * 
 * Query params:
 * - startDate: ISO date string
 * - endDate: ISO date string
 * - category: Filter by category (optional)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 */
export const getTopJobSeekers = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { category } = req.query;
    const { startDate, endDate } = parseDateRange(req.query);

    // Build query
    const query = {
        status: "Active",
        isRegistrationComplete: true
    };

    if (category && category !== "All") {
        query.category = category;
    }

    if (startDate && endDate) {
        query.createdAt = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
        query.createdAt = { $gte: startDate };
    } else if (endDate) {
        query.createdAt = { $lte: endDate };
    }

    // Get total count
    const totalCount = await JobSeeker.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Get job seekers with their latest application status
    const jobSeekers = await JobSeeker.find(query)
        .populate("specializationId", "name")
        .select("name profilePhoto specializationId selectedSkills updatedAt status")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    // Get application statuses for these job seekers
    const jobSeekerIds = jobSeekers.map(js => js._id);
    const applications = await Application.find({
        jobSeeker: { $in: jobSeekerIds }
    })
        .select("jobSeeker status updatedAt")
        .sort({ updatedAt: -1 })
        .lean();

    // Map latest application status to each job seeker
    const applicationStatusMap = {};
    applications.forEach(app => {
        const jsId = app.jobSeeker.toString();
        if (!applicationStatusMap[jsId]) {
            applicationStatusMap[jsId] = app.status;
        }
    });

    // Calculate availability based on recency
    const now = new Date();
    const getAvailability = (updatedAt) => {
        const daysDiff = Math.floor((now - new Date(updatedAt)) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 7) return "Immediate";
        if (daysDiff <= 14) return "2 Weeks";
        if (daysDiff <= 30) return "Notice Period";
        return "Not Available";
    };

    // Get display status based on application status
    const getDisplayStatus = (appStatus, jsId) => {
        const status = applicationStatusMap[jsId];
        if (!status) return "Profile Review";

        switch (status) {
            case "Shortlisted": return "Shortlisted";
            case "Applied": return "Profile Review";
            case "Pending": return "Interviewing";
            default: return "Profile Review";
        }
    };

    // Format response
    const formattedJobSeekers = jobSeekers.map(js => ({
        _id: js._id,
        name: js.name || "Unknown",
        profilePhoto: js.profilePhoto,
        specialization: js.specializationId?.name || "Not specified",
        skills: js.selectedSkills?.slice(0, 3) || [],
        availability: getAvailability(js.updatedAt),
        lastActive: js.updatedAt,
        status: getDisplayStatus(js.status, js._id.toString()),
    }));

    return res.status(200).json(
        ApiResponse.success(
            { jobSeekers: formattedJobSeekers },
            "Top job seekers fetched successfully",
            {
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    limit,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1,
                },
                dateRange: startDate && endDate ? { startDate, endDate } : null,
            }
        )
    );
});

/**
 * Get Job Seeker Categories for filter dropdown
 */
export const getJobSeekerCategories = asyncHandler(async (req, res) => {
    const categories = await JobSeeker.distinct("category", { status: "Active" });

    return res.status(200).json(
        ApiResponse.success(
            {
                categories: ["All", ...categories.filter(Boolean)]
            },
            "Categories fetched successfully"
        )
    );
});
