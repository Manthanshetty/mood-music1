import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import moodsRouter from "./moods";
import songsRouter from "./songs";
import playlistsRouter from "./playlists";
import historyRouter from "./history";
import videosRouter from "./videos";
import dashboardRouter from "./dashboard";
import jioRouter from "./jio";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(moodsRouter);
router.use(songsRouter);
router.use(playlistsRouter);
router.use(historyRouter);
router.use(videosRouter);
router.use(dashboardRouter);
router.use(jioRouter);

export default router;
