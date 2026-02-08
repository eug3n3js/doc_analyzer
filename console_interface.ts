import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { DocumentAnalyzer } from "./document_analyzer";
import { Document } from "./vertex_ai";

export class ConsoleInterface {
    private analyzer: DocumentAnalyzer;

    constructor(analyzer: DocumentAnalyzer) {
        this.analyzer = analyzer;
    }

    private createRl(): readline.Interface {
        return readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
    }

    private question(rl: readline.Interface, q: string): Promise<string> {
        return new Promise((resolve) => rl.question(q, resolve));
    }

    private async askMode(rl: readline.Interface): Promise<number> {
        const modeStr = await this.question(
            rl,
            "Choose analysis mode (1-4): "
        );
        const mode = Number(modeStr.trim());
        const modes = [1, 2, 3, 4];
        if (!modes.includes(mode)) {
            throw new Error(`Invalid mode: ${modeStr}`);
        }
        return mode;
    }

    private async collectDocumentsFromDir(dirPath: string): Promise<Document[]> {
        const absDir = path.resolve(dirPath);
        if (!fs.existsSync(absDir) || !fs.statSync(absDir).isDirectory()) {
            throw new Error(`Directory not found: ${absDir}`);
        }

        const entries = fs.readdirSync(absDir, { withFileTypes: true });
        const results: Document[] = [];

        for (const entry of entries) {
            if (!entry.isFile()) continue;
            const fullPath = path.join(absDir, entry.name);
            const ext = path.extname(fullPath).toLowerCase();
            if (ext === ".pdf" || ext === ".docx") {
                const doc = await this.analyzer.read_document(fullPath);
                results.push(doc);
            }
        }

        if (results.length === 0) {
            throw new Error("No .pdf or .docx files found in directory");
        }

        return results;
    }

    public async run(): Promise<void> {
        const rl = this.createRl();
        try {
            console.log("=== Document Analyzer CLI ===");
            const dirPath = await this.question(
                rl,
                "Enter directory path with .pdf/.docx files: "
            );
            const mode = await this.askMode(rl);

            console.log("Scanning and processing documents in directory...");
            const docs = await this.collectDocumentsFromDir(dirPath.trim());
            console.log(`Documents found: ${docs.length}`);
            console.log("Running combined analysis in Vertex AI...");
            const result = await this.analyzer.analyze_document(docs, mode);

            console.log("=== Analysis result ===");
            console.log(result);
        } catch (error) {
            console.error(String(error));
        } finally {
            rl.close();
        }
    }
}


