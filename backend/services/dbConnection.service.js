import {
    clearMySQLPool,
    getMySQLPool,
    initMySQLPool,
} from "../db/mysqlPool.js";
import MyError from "../utils/error.js";

const connectMySQL = async (host, port, user, password) => {
    if (!host || !port || !user || !password) {
        throw new MyError(
            400,
            "MySQL connection requires host, port, user and password",
        );
    }

    try {
        initMySQLPool({ host, port, user, password });
        const pool = getMySQLPool();

        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();

        return {
            success: true,
            message: "MySQL connection established successfully",
            connection: {
                type: "mysql",
                host,
                port,
            },
        };
    } catch (error) {
        clearMySQLPool();
        if (error.code === "ER_ACCESS_DENIED_ERROR")
            throw new MyError(
                401,
                "Access denied: incorrect username or password",
            );

        throw new MyError(
            500,
            `MySQL pool connection failed: ${error.message}`,
        );
    }
};

export { connectMySQL };
