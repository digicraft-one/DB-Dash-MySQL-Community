import mysql from "mysql2/promise";

let pool = null;

const initMySQLPool = ({ host, port, user, password }) => {
    if (!host || !port || !user || !password) {
        throw new Error(
            "MySQL credentials are required for pool initialization.",
        );
    }

    if (!pool) {
        pool = mysql.createPool({
            host,
            port: Number(port),
            user,
            password,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            dateStrings: true,
        });
        console.log("MySQL pool initialized.");
    }
};

const getMySQLPool = () => {
    if (!pool) throw new Error("MySQL pool is not initialized.");
    return pool;
};

const isPoolInitialized = () => !!pool;

const clearMySQLPool = () => {
    if (pool) {
        pool.end().catch(() => {});
        pool = null;
        console.log("MySQL pool cleared.");
    }
};

export { getMySQLPool, initMySQLPool, isPoolInitialized, clearMySQLPool };
