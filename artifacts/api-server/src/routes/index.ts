import { Router, type IRouter } from "express";
import healthRouter from "./health";
import clashRouter from "./clash";
import warPlannerRouter from "./war-planner";
import aiCoachRouter from "./ai-coach";

const router: IRouter = Router();

router.use(healthRouter);
router.use(clashRouter);

/*
 * War Planner ska registreras före ai-coach.
 *
 * war-planner.ts använder:
 *   /ai/war-planner
 *
 * tillsammans med API:ets /api-prefix blir
 * den publika endpointen:
 *   /api/ai/war-planner
 *
 * Den gamla /ai/war-planner-routen har tagits
 * bort från ai-coach.ts.
 */
router.use(warPlannerRouter);

router.use(aiCoachRouter);

export default router;
