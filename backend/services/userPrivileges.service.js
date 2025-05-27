import { getMySQLPool } from "../db/mysqlPool.js";
import MyError from "../utils/error.js";

const listUsersWithAccess = async () => {
    const pool = getMySQLPool();
    const [users] = await pool.query(`SELECT user, host FROM mysql.user`);
    return {
        success: true,
        users,
    };
};

const getUserGrants = async (user, host = "%") => {
    const pool = getMySQLPool();

    const escapedUser = user.replace(/'/g, "''");
    const escapedHost = host.replace(/'/g, "''");

    const userStr = `'${escapedUser}'@'${escapedHost}'`;

    try {
        const [grants] = await pool.query(`SHOW GRANTS FOR ${userStr}`);
        return {
            success: true,
            user: `${user}@${host}`,
            grants: grants.map((g) => Object.values(g)[0]),
        };
    } catch (error) {
        throw new MyError(500, "Failed to retrieve user grants", error);
    }
};

export { getUserGrants, listUsersWithAccess };
