import { LanguageIdEnum } from "monaco-sql-languages";

import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import MySQLWorker from "monaco-sql-languages/esm/languages/mysql/mysql.worker?worker";

self.MonacoEnvironment = {
    getWorker(_, label) {
        if (label === LanguageIdEnum.MYSQL) {
            return new MySQLWorker();
        }
        return new EditorWorker();
    },
};
