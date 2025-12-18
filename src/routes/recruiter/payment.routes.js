import { Router } from "express";
import { verifyRecruiterJWT } from "../../middlewares/recruiter/authRecruiter.js";
import { recruiterPayment } from "../../controllers/recruiter/recruiter.payment.controller.js";


const router = Router();

router.post("/", verifyRecruiterJWT, recruiterPayment);

export default router;
