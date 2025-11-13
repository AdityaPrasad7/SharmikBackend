import { Router } from "express";
import {
  getAllStates,
  getCitiesByState,
  getCitiesByStateName,
  getYears,
} from "../../controllers/location/location.controller.js";

const router = Router();

// Get All States (Public - for registration)
router.get("/states", getAllStates);

// Get Cities by State ID (Public - for registration)
router.get("/cities/state/:stateId", getCitiesByState);

// Get Cities by State Name (Alternative - Public - for registration)
router.get("/cities/state-name/:stateName", getCitiesByStateName);

// Get Years for Year of Passing Dropdown (Public - for registration)
router.get("/years", getYears);

export default router;

