import { Router } from "express";
import {
    handleGetUserGrants,
    handleListDBUsers,
} from "../controller/user.controller.js";

const router = Router();

router.route("/").get(handleListDBUsers);
router.get("/privileges", handleGetUserGrants);

export default router;
