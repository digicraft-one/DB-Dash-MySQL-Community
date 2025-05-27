import * as monaco from "monaco-editor";
import "monaco-sql-languages/esm/languages/mysql/mysql.contribution";
import { useEffect, useRef, useState } from "react";
import {
    FiDatabase,
    FiLoader,
    FiPlay,
    FiRotateCcw,
    FiRotateCw,
    FiTerminal,
    FiTrash2,
} from "react-icons/fi";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";

import "../../monacoSetup.js";
import PremiumFeatureModal from "../ui/PremiumFeatureCard.jsx";
import CopyButton from "./common/CopyButton.jsx";
import RefreshButton from "./common/RefreshButton.jsx";

const EDITOR_OPTIONS = {
    language: "mysql",
    theme: "vs-dark",
    automaticLayout: true,
    minimap: { enabled: true },
    fontSize: 14,
    fontFamily: "Fira Code, Menlo, Monaco, Consolas, monospace",
    scrollBeyondLastLine: false,
    renderLineHighlight: "gutter",
    lineNumbers: "on",
    roundedSelection: true,
    cursorBlinking: "smooth",
    tabSize: 2,
    scrollbar: {
        verticalScrollbarSize: 8,
        horizontalScrollbarSize: 8,
        alwaysConsumeMouseWheel: false,
    },
    wordWrap: "on",
    renderWhitespace: "selection",
    renderIndentGuides: true,
    smoothScrolling: true,
    padding: { top: 12 },
    inlineSuggest: { enabled: true },
};

const INITIAL_QUERIES = {
    database: (dbName) => [
        `-- Database: ${dbName}`,
        ` `,
        `USE ${dbName};`,
        `SHOW TABLES;`,
    ],
    table: (dbName, tableName) => [
        `-- Table: ${tableName}`,
        `USE ${dbName};`,
        `SELECT * FROM ${tableName} LIMIT 100;`,
    ],
};

const getInitialContent = (dbName, tableName) => {
    const baseContent = [
        `-- This is a Premium Feature`,
        ` `,
        `-- Ctrl+Enter to execute`,
        `-- Wait 1.5 seconds to get AI suggestions`,
        ` `,
        `SHOW DATABASES;`,
        `SELECT VERSION() AS mysql_version;`,
        ` `,
    ];

    if (dbName && tableName)
        baseContent.push(...INITIAL_QUERIES.table(dbName, tableName));
    else if (dbName) baseContent.push(...INITIAL_QUERIES.database(dbName));

    return baseContent.join("\n");
};

const EditorControls = ({
    onExecute,
    onClear,
    query,
    isExecuting,
    undoEdit,
    redoEdit,
}) => (
    <>
        <CopyButton
            query={query}
            position="bottom-right"
            shortcutKey="(Ctrl+C)"
        />
        <div className="absolute bottom-4 right-15 flex z-40 gap-4">
            <button
                onClick={undoEdit}
                className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md border border-gray-700 transition-all duration-200 hover:text-white"
                title="Undo (Ctrl+Z)"
            >
                <FiRotateCcw className="w-4 h-4" />
            </button>
            <button
                onClick={redoEdit}
                className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md border border-gray-700 transition-all duration-200 hover:text-white"
                title="Redo (Ctrl+Y)"
            >
                <FiRotateCw className="w-4 h-4" />
            </button>
            <button
                onClick={onClear}
                className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md border border-gray-700 transition-all duration-200 hover:text-white"
                title="Clear Editor (Ctrl+Shift+Del)"
            >
                <FiTrash2 className="w-4 h-4" />
            </button>
            <button
                onClick={onExecute}
                disabled={isExecuting}
                className={`p-2 rounded-lg shadow-lg flex items-center justify-center border transition-all duration-200 ${
                    isExecuting
                        ? "border-blue-800 bg-blue-900/30 text-blue-300 cursor-wait"
                        : "border-blue-600 bg-blue-600 hover:bg-blue-500 text-white hover:shadow-blue-500/20"
                }`}
                title="Execute (Ctrl+Enter)"
            >
                {isExecuting ? (
                    <FiLoader className="animate-spin w-4 h-4" />
                ) : (
                    <FiPlay className="w-4 h-4" />
                )}
            </button>
        </div>
    </>
);

const QueryConsole = () => {
    const { dbName, tableName } = useParams();
    const editorRef = useRef(null);
    const monacoRef = useRef(null);
    const [isExecuting, setIsExecuting] = useState(false);
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [queryText, setQueryText] = useState("");

    useEffect(() => {
        if (!editorRef.current) return;

        monacoRef.current = monaco.editor.create(editorRef.current, {
            value: getInitialContent(dbName, tableName),
            ...EDITOR_OPTIONS,
        });

        monacoRef.current.addAction({
            id: "execute-query",
            label: "Execute Query",
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
            run: executeQuery,
        });

        monacoRef.current.addAction({
            id: "clear-editor",
            label: "Clear Editor",
            keybindings: [
                monaco.KeyMod.CtrlCmd |
                    monaco.KeyMod.Shift |
                    monaco.KeyCode.Delete,
            ],
            run: clearConsole,
        });

        monacoRef.current.addAction({
            id: "undo-edit",
            label: "Undo",
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ],
            run: undoEdit,
        });

        monacoRef.current.addAction({
            id: "redo-edit",
            label: "Redo",
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyY],
            run: redoEdit,
        });

        monacoRef.current.onDidChangeModelContent(() => {
            setQueryText(monacoRef.current.getValue());
        });

        return () => monacoRef.current?.dispose();
    }, [dbName, tableName]);

    const executeQuery = async () => {
        setIsExecuting(true);
        setShowPremiumModal(true);
    };

    const undoEdit = () => monacoRef.current?.trigger(null, "undo", null);
    const redoEdit = () => monacoRef.current?.trigger(null, "redo", null);

    const clearConsole = () => {
        monacoRef.current.setValue("");
        toast.info("Editor cleared");
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all duration-300">
                        <FiTerminal className="text-blue-400 text-2xl" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">
                            SQL Console
                        </h1>
                        <div className="text-sm text-gray-400 flex items-center gap-2">
                            {dbName && (
                                <>
                                    <span className="text-blue-300">
                                        {dbName}
                                    </span>
                                    {tableName && (
                                        <>
                                            <span className="text-gray-500">
                                                /
                                            </span>
                                            <span className="text-purple-300">
                                                {tableName}
                                            </span>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <RefreshButton
                    action={() => window.location.reload()}
                    title="Refresh in case editor is not visible"
                />
            </div>

            <div className="flex-grow bg-gray-850 rounded-xl border border-gray-700/50 overflow-hidden shadow-xl">
                <div className="p-4 border-b border-gray-700/50 flex justify-between items-center bg-gray-800/50 backdrop-blur-sm">
                    <h3 className="text-lg font-medium text-white flex items-center gap-2">
                        <FiDatabase className="text-blue-400" />
                        Query Editor
                    </h3>
                    <div className="text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded">
                        {monacoRef.current?.getModel()?.getLineCount() || 0}{" "}
                        lines
                    </div>
                </div>

                <PremiumFeatureModal
                    title="Write and execute SQL Queries with the help of AI"
                    isOpen={showPremiumModal}
                    onClose={() => {
                        setIsExecuting(false);
                        setShowPremiumModal(false);
                    }}
                />

                <div className="h-[91%] relative">
                    <div ref={editorRef} className="relative h-full w-full" />
                    <EditorControls
                        onExecute={executeQuery}
                        onClear={clearConsole}
                        query={queryText || ""}
                        isExecuting={isExecuting}
                        undoEdit={undoEdit}
                        redoEdit={redoEdit}
                    />
                </div>
            </div>
        </div>
    );
};

export default QueryConsole;
