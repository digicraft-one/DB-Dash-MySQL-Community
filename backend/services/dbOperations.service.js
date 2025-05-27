import { getMySQLPool } from "../db/mysqlPool.js";
import MyError from "../utils/error.js";

const getConnectionDetails = async () => {
    try {
        const pool = getMySQLPool();
        const connection = await pool.getConnection();
        await connection.ping();

        // Basic info
        const [[{ version }]] = await connection.query(
            "SELECT VERSION() AS version",
        );
        const [[{ Value: uptimeInSeconds }]] = await connection.query(
            "SHOW STATUS LIKE 'Uptime'",
        );
        const [[{ Value: characterSet }]] = await connection.query(
            "SHOW VARIABLES LIKE 'character_set_server'",
        );
        const [[{ Value: collation }]] = await connection.query(
            "SHOW VARIABLES LIKE 'collation_server'",
        );

        // All databases
        const [databases] = await connection.query("SHOW DATABASES");

        // User and host info
        const [rows] = await connection.execute("SELECT USER(), DATABASE();");
        const userHost = rows[0]["USER()"];
        const currentDb = rows[0]["DATABASE()"];
        const [user, host] = userHost.split("@");

        // Server variables and status
        const [variables] = await connection.query("SHOW VARIABLES");
        const [status] = await connection.query("SHOW STATUS");

        // Database size in MB
        const [dbSizes] = await connection.query(`
            SELECT table_schema AS databaseName,
                   ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS sizeMB
            FROM information_schema.tables
            GROUP BY table_schema
        `);

        // Table statistics
        let tableStats = { totalTables: 0, totalRows: 0, totalSize: 0 };
        try {
            const [stats] = await connection.query(`
                SELECT 
                    COUNT(*) as totalTables,
                    SUM(table_rows) as totalRows,
                    SUM(data_length + index_length) as totalSize
                FROM information_schema.tables
                WHERE table_schema NOT IN ('information_schema', 'mysql', 'performance_schema', 'sys')
            `);
            tableStats = stats[0];
        } catch (error) {
            console.warn("Could not fetch table statistics:", error.message);
        }

        await connection.release();

        return {
            success: true,
            message: "MySQL connection established successfully",
            connection: {
                type: "mysql",
                host,
                user,
                currentDatabase: currentDb,
            },
            serverInfo: {
                version,
                uptimeInSeconds,
                characterSet,
                collation,
                currentTime: new Date().toISOString(),
            },
            databases: databases.map((db) => db.Database),
            databaseSizes: dbSizes,
            tableStats,
            serverVariables: variables,
            serverStatus: status,
        };
    } catch (error) {
        throw new MyError(500, `MySQL connection failed: ${error.message}`, {
            originalError: error,
        });
    }
};

const listMySQLDatabases = async () => {
    try {
        const pool = getMySQLPool();

        const [databases] = await pool.query("SHOW DATABASES;");

        return {
            success: true,
            message: "Databases retrieved successfully",
            databases: databases.map((db) => db.Database),
        };
    } catch (error) {
        throw new MyError(500, `Error listing databases: ${error.message}`);
    }
};

const createDatabase = async (databaseName) => {
    if (!databaseName || typeof databaseName !== "string") {
        throw new MyError(
            400,
            "Database name is required and must be a string",
        );
    }

    const pool = getMySQLPool();

    try {
        await pool.query(`CREATE DATABASE ??`, [databaseName]);
        return {
            success: true,
            message: `Database '${databaseName}' created successfully`,
            databaseName,
        };
    } catch (error) {
        throw new MyError(500, `Failed to create database: ${error.message}`);
    }
};

const dropDatabase = async (dbName) => {
    if (!dbName) throw new MyError(400, "Database name is required");
    const pool = getMySQLPool();

    try {
        await pool.query(`DROP DATABASE ??`, [dbName]);
        return {
            success: true,
            message: `Database '${dbName}' dropped successfully`,
            databaseName: dbName,
        };
    } catch (error) {
        throw new MyError(500, `Failed to drop database: ${error.message}`);
    }
};

const getDatabaseOverview = async (dbName) => {
    if (!dbName) throw new MyError(400, "Database name is required");

    try {
        const pool = getMySQLPool();

        const connectionConfig = {
            host:
                pool.config?.host ||
                pool.config?.connectionConfig?.host ||
                "localhost",
            port:
                pool.config?.port ||
                pool.config?.connectionConfig?.port ||
                3306,
            engine:
                pool.config?.type ||
                pool.config?.connectionConfig?.type ||
                "MySQL",
        };

        // Basic database existence check
        const [databases] = await pool.query(
            "SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?",
            [dbName],
        );

        if (databases.length === 0) {
            throw new MyError(404, `Database '${dbName}' not found`);
        }

        // Basic database stats
        const [tableStats] = await pool.query(
            `SELECT 
                COUNT(*) AS table_count,
                SUM(data_length + index_length) AS total_size,
                SUM(table_rows) AS total_rows,
                SUM(index_length) AS total_index_size,
                COUNT(index_name) AS total_indexes
            FROM information_schema.tables t
            LEFT JOIN information_schema.statistics s 
                ON t.table_schema = s.table_schema AND t.table_name = s.table_name
            WHERE t.table_schema = ?`,
            [dbName],
        );

        // Schema information
        const [schemaInfo] = await pool.query(
            `SELECT 
                default_character_set_name AS charset,
                default_collation_name AS collation
            FROM information_schema.SCHEMATA
            WHERE schema_name = ?`,
            [dbName],
        );

        // Creation date
        const [createDateResult] = await pool.query(
            `SELECT CREATE_TIME 
             FROM information_schema.tables 
             WHERE table_schema = ? 
             ORDER BY CREATE_TIME ASC 
             LIMIT 1`,
            [dbName],
        );

        // Server version
        const [versionResult] = await pool.query("SELECT VERSION() as version");

        // Connection info
        const [connectionInfo] = await pool.query(
            `SHOW VARIABLES LIKE 'max_connections'`,
        );
        const [activeConnections] = await pool.query(
            `SELECT COUNT(*) as connections FROM information_schema.processlist WHERE db = ?`,
            [dbName],
        );

        // Query cache info
        const [queryCacheInfo] = await pool.query(
            `SHOW VARIABLES LIKE 'query_cache_size'`,
        );

        // User privileges
        const [userPrivileges] = await pool.query(
            `SELECT * FROM information_schema.schema_privileges 
             WHERE table_schema = ?`,
            [dbName],
        );

        // Replication status
        let replication = null;
        try {
            const [replicationStatus] = await pool.query(`SHOW SLAVE STATUS`);
            if (replicationStatus.length > 0) {
                replication = {
                    role: "Slave",
                    masterHost: replicationStatus[0].Master_Host,
                };
            } else {
                const [masterStatus] = await pool.query(`SHOW MASTER STATUS`);
                if (masterStatus.length > 0) {
                    replication = {
                        role: "Master",
                    };
                }
            }
        } catch (e) {
            console.log("Replication check failed:", e.message);
        }

        // Largest tables (corrected query)
        const [largestTables] = await pool.query(
            `SELECT 
                table_name as name,
                table_rows as \`rows\`,
                data_length + index_length as size,
                index_length
            FROM information_schema.tables
            WHERE table_schema = ?
            ORDER BY size DESC
            LIMIT 5`,
            [dbName],
        );

        return {
            success: true,
            database: dbName,
            status: "Connected",
            sizeInMB: ((tableStats[0].total_size || 0) / (1024 * 1024)).toFixed(
                2,
            ),
            numberOfTables: tableStats[0].table_count,
            totalRows: tableStats[0].total_rows,
            totalIndexes: tableStats[0].total_indexes,
            collation: schemaInfo[0]?.collation || "Unknown",
            charset: schemaInfo[0]?.charset || "Unknown",
            creationDate: createDateResult[0]?.CREATE_TIME || "Unknown",
            version: versionResult[0]?.version,
            maxConnections: connectionInfo[0]?.Value,
            activeConnections: activeConnections[0]?.connections,
            queryCacheSize: queryCacheInfo[0]?.Value,
            userPrivileges,
            replication,
            largestTables,
            host: connectionConfig.host,
            port: connectionConfig.port,
            engine: connectionConfig.engine,
        };
    } catch (error) {
        throw new MyError(500, `Failed to retrieve overview: ${error.message}`);
    }
};

const getDatabaseSchema = async (dbName) => {
    if (!dbName) throw new MyError(400, "Database name is required");

    try {
        const pool = getMySQLPool();
        const [exists] = await pool.query(
            `SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?`,
            [dbName],
        );

        if (exists.length === 0) {
            throw new MyError(404, `Database '${dbName}' does not exist`);
        }

        const [columns] = await pool.query(
            `SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT, EXTRA
             FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = ?
             ORDER BY TABLE_NAME, ORDINAL_POSITION`,
            [dbName],
        );

        const schemaMap = {};

        columns.forEach((col) => {
            if (!schemaMap[col.TABLE_NAME]) {
                schemaMap[col.TABLE_NAME] = [];
            }
            schemaMap[col.TABLE_NAME].push({
                name: col.COLUMN_NAME,
                type: col.COLUMN_TYPE,
                nullable: col.IS_NULLABLE === "YES",
                key: col.COLUMN_KEY,
                default: col.COLUMN_DEFAULT,
                extra: col.EXTRA,
            });
        });

        const schema = Object.entries(schemaMap).map(
            ([tableName, columns]) => ({
                tableName,
                columns,
            }),
        );

        return {
            success: true,
            database: dbName,
            tables: schema,
        };
    } catch (error) {
        throw new MyError(500, `Failed to fetch schema: ${error.message}`);
    }
};

const getTableDetails = async (dbName, tableName) => {
    if (!dbName) throw new MyError(400, "Database name is required");
    if (!tableName) throw new MyError(400, "Table name is required");

    try {
        const pool = getMySQLPool();

        const [dbExists] = await pool.query(
            `SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?`,
            [dbName],
        );
        if (dbExists.length === 0) {
            throw new MyError(404, `Database '${dbName}' does not exist`);
        }

        const [tableExists] = await pool.query(
            `SELECT TABLE_NAME FROM information_schema.TABLES 
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
            [dbName, tableName],
        );
        if (tableExists.length === 0) {
            throw new MyError(
                404,
                `Table '${tableName}' does not exist in database '${dbName}'`,
            );
        }

        const [columns] = await pool.query(
            `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT, EXTRA
             FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
             ORDER BY ORDINAL_POSITION`,
            [dbName, tableName],
        );

        const schema = columns.map((col) => ({
            name: col.COLUMN_NAME,
            type: col.COLUMN_TYPE,
            nullable: col.IS_NULLABLE === "YES",
            key: col.COLUMN_KEY,
            default: col.COLUMN_DEFAULT,
            extra: col.EXTRA,
        }));

        return {
            success: true,
            database: dbName,
            table: tableName,
            columns: schema,
        };
    } catch (error) {
        throw new MyError(
            500,
            `Failed to fetch table schema: ${error.message}`,
        );
    }
};

const getDatabaseCode = async (dbName) => {
    try {
        const pool = getMySQLPool();

        const [tables] = await pool.query(
            `SHOW FULL TABLES FROM \`${dbName}\` WHERE Table_type = 'BASE TABLE'`,
        );

        const tableKey = `Tables_in_${dbName}`; // Column name for table names

        const results = {};

        // Step 2: Loop through each table and get CREATE TABLE
        for (const row of tables) {
            const tableName = row[tableKey];
            const [createResult] = await pool.query(
                `SHOW CREATE TABLE \`${dbName}\`.\`${tableName}\``,
            );
            results[tableName] = createResult[0]["Create Table"];
        }

        return {
            success: true,
            tables: results,
        };
    } catch (error) {
        throw new MyError(
            500,
            `Failed to retrieve table codes: ${error.message}`,
        );
    }
};

export {
    createDatabase,
    dropDatabase,
    getConnectionDetails,
    getDatabaseCode,
    getDatabaseOverview,
    getDatabaseSchema,
    getTableDetails,
    listMySQLDatabases,
};
