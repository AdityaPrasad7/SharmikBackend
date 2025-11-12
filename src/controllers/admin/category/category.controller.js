import { Category } from "../../../models/category/category.model.js";
import ApiError from "../../../utils/ApiError.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";

const normalizeString = (value) =>
  typeof value === "string" ? value.trim() : "";

const buildCategoryPayload = (body, userId, options = {}) => {
  const { includeCreatedBy = false } = options;

  const payload = {
    status: body?.status ?? "Active",
  };

  if (typeof body?.name === "string") {
    payload.name = normalizeString(body.name);
  }

  if (typeof body?.description === "string") {
    payload.description = normalizeString(body.description);
  }

  if (userId) {
    payload.updatedBy = userId;
    if (includeCreatedBy) {
      payload.createdBy = userId;
    }
  }

  return payload;
};

export const createCategory = asyncHandler(async (req, res) => {
  const rawName = req.body?.name;
  const normalizedName = normalizeString(rawName);

  if (!normalizedName) {
    throw new ApiError(400, "Name is required");
  }

  const existing = await Category.findOne({
    name: normalizedName,
  });

  if (existing) {
    throw new ApiError(409, "Category with this name already exists");
  }

  const payload = buildCategoryPayload(
    { ...req.body, name: normalizedName },
    req.user?._id,
    {
      includeCreatedBy: true,
    }
  );

  const category = await Category.create(payload);

  return res
    .status(201)
    .json(
      ApiResponse.success(
        { category },
        "Category created successfully"
      )
    );
});

export const getAllCategories = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const query = {};
  if (status && ["Active", "Inactive"].includes(status)) {
    query.status = status;
  }

  const categories = await Category.find(query)
    .sort({ name: 1 })
    .lean();

  return res
    .status(200)
    .json(
      ApiResponse.success(
        { categories },
        "Categories fetched successfully"
      )
    );
});

export const getCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findById(id).lean();

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  return res
    .status(200)
    .json(
      ApiResponse.success(
        { category },
        "Category fetched successfully"
      )
    );
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const category = await Category.findById(id);

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  const payload = buildCategoryPayload(req.body, req.user?._id);

  if (payload.name) {
    if (category.name.toLowerCase() !== payload.name.toLowerCase()) {
      const duplicate = await Category.findOne({
        name: payload.name,
        _id: { $ne: id },
      });

      if (duplicate) {
        throw new ApiError(
          409,
          "Another category with this name exists"
        );
      }
    }
  }

  Object.assign(category, {
    ...payload,
    name: payload.name ?? category.name,
    description: payload.description ?? category.description,
  });

  await category.save();

  return res
    .status(200)
    .json(
      ApiResponse.success(
        { category },
        "Category updated successfully"
      )
    );
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findByIdAndDelete(id);

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  return res
    .status(200)
    .json(ApiResponse.success(null, "Category deleted successfully"));
});

