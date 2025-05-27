import {
    getUserGrants,
    listUsersWithAccess,
} from "../services/userPrivileges.service.js";

import asyncHandler from "../utils/asyncHandler.js";
import MyError from "../utils/error.js";

const handleListDBUsers = asyncHandler(async (req, res) => {
    const result = await listUsersWithAccess();
    res.status(200).json(result);
});

const handleGetUserGrants = asyncHandler(async (req, res) => {
    const { user, host } = req.query;
    if (!user) throw new MyError(400, "User is required");

    const result = await getUserGrants(user, host);
    res.status(200).json(result);
});

export { handleGetUserGrants, handleListDBUsers };
