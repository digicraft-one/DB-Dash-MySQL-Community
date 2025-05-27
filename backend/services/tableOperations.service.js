import { getMySQLPool } from "../db/mysqlPool.js";
import MyError from "../utils/error.js";

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

        const [tableMeta] = await pool.query(
            `SELECT TABLE_NAME, ENGINE, TABLE_COLLATION, TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH
             FROM information_schema.TABLES 
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
            [dbName, tableName],
        );

        if (tableMeta.length === 0) {
            throw new MyError(
                404,
                `Table '${tableName}' does not exist in database '${dbName}'`,
            );
        }

        const meta = tableMeta[0];
        const sizeInBytes = (meta.DATA_LENGTH || 0) + (meta.INDEX_LENGTH || 0);

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
            engine: meta.ENGINE,
            collation: meta.TABLE_COLLATION,
            rowCount: meta.TABLE_ROWS,
            size: sizeInBytes / 1024,
            columns: schema,
        };
    } catch (error) {
        throw new MyError(
            500,
            `Failed to fetch table schema: ${error.message}`,
        );
    }
};

const createTable = async (dbName, tableName, columns) => {
    if (
        !dbName ||
        !tableName ||
        !Array.isArray(columns) ||
        columns.length === 0
    ) {
        throw new MyError(
            400,
            "dbName, tableName, and a non-empty columns array are required",
        );
    }

    const pool = getMySQLPool();

    try {
        const columnDefs = columns.map((col) => {
            const {
                name,
                type,
                notNull,
                defaultValue,
                autoIncrement,
                unique,
                checkExpression,
            } = col;

            if (!name || !type) {
                throw new MyError(400, "Each column must have a name and type");
            }

            const parts = [`\`${name}\``, type];

            if (notNull) parts.push("NOT NULL");
            if (unique) parts.push("UNIQUE");
            if (autoIncrement) parts.push("AUTO_INCREMENT");
            if (defaultValue !== undefined && defaultValue !== null) {
                const isStringType = /char|text|blob|enum|set/i.test(type);
                const val = isStringType ? `'${defaultValue}'` : defaultValue;
                parts.push(`DEFAULT ${val}`);
            }
            if (checkExpression) parts.push(`CHECK (${checkExpression})`);

            return parts.join(" ");
        });

        // Handle primary key separately (supports composite keys)
        const primaryKeys = columns
            .filter((col) => col.primaryKey)
            .map((col) => `\`${col.name}\``);

        if (primaryKeys.length > 0) {
            columnDefs.push(`PRIMARY KEY (${primaryKeys.join(", ")})`);
        }

        const createTableSQL = `CREATE TABLE \`${dbName}\`.\`${tableName}\` (${columnDefs.join(
            ", ",
        )});`;

        await pool.query(createTableSQL);

        return {
            success: true,
            message: `Table '${tableName}' created successfully in database '${dbName}'`,
        };
    } catch (error) {
        throw new MyError(500, `Failed to create table: ${error.message}`);
    }
};

const viewTableData = async (dbName, tableName) => {
    try {
        const pool = getMySQLPool();

        const [rows] = await pool.query(
            `SELECT * FROM \`${dbName}\`.\`${tableName}\` LIMIT 100`,
        );

        const [columnInfo] = await pool.query(
            `SELECT COLUMN_NAME, COLUMN_TYPE 
             FROM information_schema.COLUMNS 
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? 
             ORDER BY ORDINAL_POSITION`,
            [dbName, tableName],
        );

        const columns = columnInfo.map((col) => ({
            name: col.COLUMN_NAME,
            type: col.COLUMN_TYPE, // e.g., 'varchar(255)', 'int(11)', etc.
        }));

        return {
            success: true,
            columns,
            data: rows,
        };
    } catch (error) {
        throw new MyError(500, `Failed to retrieve data: ${error.message}`);
    }
};

const dropColumnsFromTable = async (dbName, tableName, columnNames) => {
    if (
        !dbName ||
        !tableName ||
        !Array.isArray(columnNames) ||
        columnNames.length === 0
    ) {
        throw new MyError(
            400,
            "dbName, tableName, and a non-empty columnNames array are required",
        );
    }

    try {
        const pool = getMySQLPool();

        const dropQueries = columnNames.map((col) => {
            if (!col || typeof col !== "string") {
                throw new MyError(
                    400,
                    "Each column name must be a valid string",
                );
            }
            return `DROP COLUMN \`${col}\``;
        });

        const alterSQL = `ALTER TABLE \`${dbName}\`.\`${tableName}\` ${dropQueries.join(
            ", ",
        )}`;

        await pool.query(alterSQL);

        return {
            success: true,
            message: `Dropped ${columnNames.length} column(s) from '${tableName}' successfully`,
        };
    } catch (error) {
        throw new MyError(500, `Failed to drop columns: ${error.message}`);
    }
};

const dropTable = async (dbName, tableName) => {
    try {
        const pool = getMySQLPool();

        await pool.query(`DROP TABLE \`${dbName}\`.\`${tableName}\``);

        return {
            success: true,
            message: `Table '${tableName}' dropped successfully`,
        };
    } catch (error) {
        throw new MyError(500, `Failed to drop table: ${error.message}`);
    }
};

const exportTable = async (dbName, tableName, limit = null) => {
    try {
        const pool = getMySQLPool();

        let dataQuery = `SELECT * FROM \`${dbName}\`.\`${tableName}\``;
        if (limit && !isNaN(limit) && limit > 0) dataQuery += ` LIMIT ${limit}`;
        const [data] = await pool.query(dataQuery);

        // Get table size in MB
        const [tableSize] = await pool.query(
            `SELECT 
                ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS sizeMB
             FROM information_schema.TABLES 
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
            [dbName, tableName],
        );

        // Get column data types
        const [columns] = await pool.query(
            `SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT, EXTRA 
             FROM information_schema.COLUMNS 
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
            [dbName, tableName],
        );

        // Get foreign key relationships
        const [foreignKeys] = await pool.query(
            `SELECT 
                k.COLUMN_NAME, 
                k.REFERENCED_TABLE_NAME, 
                k.REFERENCED_COLUMN_NAME 
             FROM information_schema.KEY_COLUMN_USAGE k 
             WHERE k.TABLE_SCHEMA = ? AND k.TABLE_NAME = ? 
             AND k.REFERENCED_TABLE_NAME IS NOT NULL`,
            [dbName, tableName],
        );

        // Get indexes
        const [indexes] = await pool.query(
            `SHOW INDEX FROM \`${dbName}\`.\`${tableName}\``,
        );

        return {
            success: true,
            data,
            meta: {
                rowCount: data.length,
                limitApplied: limit ? limit : "all",
                tableSizeMB: tableSize[0]?.sizeMB || 0,
                columns,
                foreignKeys,
                indexes,
            },
        };
    } catch (error) {
        throw new MyError(500, `Failed to export table: ${error.message}`);
    }
};

const getTableCode = async (dbName, tableName) => {
    try {
        const pool = getMySQLPool();
        const [tableCode] = await pool.query(
            `SHOW CREATE TABLE \`${dbName}\`.\`${tableName}\``,
        );

        return {
            success: true,
            tables: { [tableName]: tableCode[0]["Create Table"] },
        };
    } catch (error) {
        throw new MyError(
            500,
            `Failed to retrieve table code: ${error.message}`,
        );
    }
};

const truncateTable = async (dbName, tableName) => {
    try {
        const pool = getMySQLPool();
        await pool.query(`TRUNCATE TABLE \`${dbName}\`.\`${tableName}\``);
        return {
            success: true,
            message: `Table '${tableName}' truncated successfully`,
        };
    } catch (error) {
        throw new MyError(500, `Failed to truncate table: ${error.message}`);
    }
};

const getTableConstraints = async (dbName, tableName) => {
    try {
        const pool = getMySQLPool();

        const [constraints] = await pool.query(
            `
            SELECT 
                tc.CONSTRAINT_NAME as name,
                tc.CONSTRAINT_TYPE as type,
                GROUP_CONCAT(kcu.COLUMN_NAME ORDER BY kcu.ORDINAL_POSITION) as columns,
                kcu.REFERENCED_TABLE_NAME as referencedTable,
                GROUP_CONCAT(kcu.REFERENCED_COLUMN_NAME ORDER BY kcu.ORDINAL_POSITION) as referencedColumns,
                rc.DELETE_RULE as onDelete,
                rc.UPDATE_RULE as onUpdate,
                NULL as checkExpression
            FROM 
                information_schema.TABLE_CONSTRAINTS tc
            LEFT JOIN 
                information_schema.KEY_COLUMN_USAGE kcu
                ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
                AND tc.TABLE_SCHEMA = kcu.TABLE_SCHEMA
                AND tc.TABLE_NAME = kcu.TABLE_NAME
            LEFT JOIN
                information_schema.REFERENTIAL_CONSTRAINTS rc
                ON tc.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
                AND tc.TABLE_SCHEMA = rc.CONSTRAINT_SCHEMA
            WHERE 
                tc.TABLE_SCHEMA = ?
                AND tc.TABLE_NAME = ?
            GROUP BY 
                tc.CONSTRAINT_NAME,
                tc.CONSTRAINT_TYPE,
                kcu.REFERENCED_TABLE_NAME,
                rc.DELETE_RULE,
                rc.UPDATE_RULE
            `,
            [dbName, tableName],
        );

        let checkConstraints = [];
        try {
            const [checkResults] = await pool.query(
                `
                SELECT 
                    CONSTRAINT_NAME as name,
                    'CHECK' as type,
                    NULL as columns,
                    NULL as referencedTable,
                    NULL as referencedColumns,
                    NULL as onDelete,
                    NULL as onUpdate,
                    CHECK_CLAUSE as checkExpression
                FROM information_schema.CHECK_CONSTRAINTS
                WHERE CONSTRAINT_SCHEMA = ?
                `,
                [dbName],
            );
            checkConstraints = checkResults.filter((c) => {
                const tablePrefix = `${tableName}_chk_`;
                return c.name.startsWith(tablePrefix);
            });
        } catch (e) {
            console.log("Check constraints not available:", e.message);
        }

        const processedConstraints = constraints.map((c) => ({
            ...c,
            columns: c.columns ? c.columns.split(",") : [],
            referencedColumns: c.referencedColumns
                ? c.referencedColumns.split(",")
                : [],
        }));

        return {
            success: true,
            constraints: [...processedConstraints, ...checkConstraints],
        };
    } catch (error) {
        throw new MyError(500, `Failed to fetch constraints: ${error.message}`);
    }
};

const insertDataIntoTable = async (dbName, tableName, data) => {
    if (!dbName || !tableName || !Array.isArray(data) || data.length === 0) {
        throw new MyError(
            400,
            "dbName, tableName, and a non-empty data array are required",
        );
    }

    try {
        const pool = getMySQLPool();

        const columns = Object.keys(data[0]);
        const placeholders = columns.map(() => "?").join(", ");
        const values = data.map((row) => columns.map((col) => row[col]));

        const sql = `INSERT INTO \`${dbName}\`.\`${tableName}\` (${columns
            .map((col) => `\`${col}\``)
            .join(", ")}) VALUES ${data
            .map(() => `(${placeholders})`)
            .join(", ")}`;

        const flatValues = values.flat();
        const [result] = await pool.query(sql, flatValues);

        return {
            success: true,
            message: `${result.affectedRows} row(s) inserted successfully into '${tableName}'`,
            insertedId: result.insertId,
        };
    } catch (error) {
        throw new MyError(500, `Failed to insert data: ${error.message}`);
    }
};

const updateDataInTable = async (dbName, tableName, oldData, newData) => {
    if (
        !dbName ||
        !tableName ||
        typeof oldData !== "object" ||
        typeof newData !== "object" ||
        Object.keys(oldData).length === 0 ||
        Object.keys(newData).length === 0
    )
        throw new MyError(
            400,
            "dbName, tableName, and non-empty oldData and newData objects are required",
        );

    try {
        const pool = getMySQLPool();

        const updates = [];
        for (const key in newData)
            if (newData[key] !== oldData[key])
                updates.push(`\`${key}\` = ${pool.escape(newData[key])}`);

        if (updates.length === 0) {
            return {
                success: true,
                message: "No changes detected. Nothing to update.",
            };
        }

        const conditions = Object.entries(oldData).map(
            ([col, val]) => `\`${col}\` = ${pool.escape(val)}`,
        );

        const sql = `
            UPDATE \`${dbName}\`.\`${tableName}\`
            SET ${updates.join(", ")}
            WHERE ${conditions.join(" AND ")}
        `;

        const [result] = await pool.query(sql);
        return {
            success: true,
            message: `Updated ${result.affectedRows} row(s) in '${tableName}'`,
        };
    } catch (error) {
        throw new MyError(500, `Failed to update rows: ${error.message}`);
    }
};

const deleteDataFromTable = async (dbName, tableName, rowConditions) => {
    if (
        !dbName ||
        !tableName ||
        !Array.isArray(rowConditions) ||
        rowConditions.length === 0
    ) {
        throw new MyError(
            400,
            "dbName, tableName, and a non-empty rowConditions array are required",
        );
    }

    try {
        const pool = getMySQLPool();
        let deleted = 0;

        for (const row of rowConditions) {
            const conditions = Object.entries(row).map(
                ([col, val]) => `\`${col}\` = ${pool.escape(val)}`,
            );
            const sql = `
                DELETE FROM \`${dbName}\`.\`${tableName}\`
                WHERE ${conditions.join(" AND ")}
            `;
            const [result] = await pool.query(sql);
            deleted += result.affectedRows;
        }

        return {
            success: true,
            message: `Deleted ${deleted} row(s) from '${tableName}'`,
        };
    } catch (error) {
        throw new MyError(500, `Failed to delete rows: ${error.message}`);
    }
};

const renameTable = async (dbName, oldTableName, newTableName) => {
    if (
        !dbName ||
        !oldTableName ||
        !newTableName ||
        oldTableName === newTableName
    ) {
        throw new MyError(
            400,
            "dbName, oldTableName, and newTableName are required and cannot be the same",
        );
    }
    try {
        const pool = getMySQLPool();
        await pool.query(`USE \`${dbName}\``);
        const sql = `ALTER TABLE \`${oldTableName}\` RENAME TO \`${newTableName}\``;
        await pool.query(sql);
        return {
            success: true,
            message: `Table '${oldTableName}' has been renamed to '${newTableName}'`,
        };
    } catch (error) {
        throw new MyError(500, `Failed to rename table: ${error.message}`);
    }
};

export {
    createTable,
    deleteDataFromTable,
    dropColumnsFromTable,
    dropTable,
    exportTable,
    getTableCode,
    getTableConstraints,
    getTableDetails,
    insertDataIntoTable,
    renameTable,
    truncateTable,
    updateDataInTable,
    viewTableData,
};
