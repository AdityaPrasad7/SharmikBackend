import { State } from "../../models/location/state.model.js";
import { City } from "../../models/location/city.model.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";

/**
 * Get All States (Public endpoint)
 * Returns all active states for dropdown selection
 */
export const getAllStates = asyncHandler(async (req, res) => {
  const states = await State.find({ status: "Active" })
    .select("_id name code")
    .sort({ name: 1 })
    .lean();

  const formattedStates = states.map((state) => ({
    _id: state._id,
    value: state._id.toString(),
    label: state.name,
    name: state.name,
    code: state.code,
  }));

  return res
    .status(200)
    .json(
      ApiResponse.success(
        { states: formattedStates },
        "States fetched successfully"
      )
    );
});

/**
 * Get Cities by State (Public endpoint)
 * Returns all active cities for a specific state
 */
export const getCitiesByState = asyncHandler(async (req, res) => {
  const { stateId } = req.params;

  if (!stateId) {
    throw new ApiError(400, "State ID is required");
  }

  // Verify state exists
  const state = await State.findById(stateId);
  if (!state) {
    throw new ApiError(404, "State not found");
  }

  // Get cities for this state
  const cities = await City.find({
    stateId: stateId,
    status: "Active",
  })
    .select("_id name stateId stateName")
    .sort({ name: 1 })
    .lean();

  const formattedCities = cities.map((city) => ({
    _id: city._id,
    value: city._id.toString(),
    label: city.name,
    name: city.name,
    stateId: city.stateId,
    stateName: city.stateName,
  }));

  return res
    .status(200)
    .json(
      ApiResponse.success(
        {
          state: {
            _id: state._id,
            name: state.name,
            code: state.code,
          },
          cities: formattedCities,
        },
        "Cities fetched successfully"
      )
    );
});

/**
 * Get Cities by State Name (Alternative endpoint)
 * Returns all active cities for a specific state by state name
 */
export const getCitiesByStateName = asyncHandler(async (req, res) => {
  const { stateName } = req.params;

  if (!stateName) {
    throw new ApiError(400, "State name is required");
  }

  // Find state by name (case-insensitive)
  const state = await State.findOne({
    name: { $regex: new RegExp(`^${stateName}$`, "i") },
    status: "Active",
  });

  if (!state) {
    throw new ApiError(404, "State not found");
  }

  // Get cities for this state
  const cities = await City.find({
    stateId: state._id,
    status: "Active",
  })
    .select("_id name stateId stateName")
    .sort({ name: 1 })
    .lean();

  const formattedCities = cities.map((city) => ({
    _id: city._id,
    value: city._id.toString(),
    label: city.name,
    name: city.name,
    stateId: city.stateId,
    stateName: city.stateName,
  }));

  return res
    .status(200)
    .json(
      ApiResponse.success(
        {
          state: {
            _id: state._id,
            name: state.name,
            code: state.code,
          },
          cities: formattedCities,
        },
        "Cities fetched successfully"
      )
    );
});

