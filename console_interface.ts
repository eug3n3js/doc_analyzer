import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { DocumentAnalyzer } from "./document_analyzer";
import { Document } from "./vertex_ai";
import { DocumentSorter, FileGroup } from "./document_sorter";

export class ConsoleInterface {
    private analyzer: DocumentAnalyzer;
    private sorter: DocumentSorter;

    constructor(analyzer: DocumentAnalyzer, sorter: DocumentSorter) {
        this.analyzer = analyzer;
        this.sorter = sorter;
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

    private async askModes(rl: readline.Interface): Promise<number[]> {
        const raw = await this.question(
            rl,
            "Choose analysis mode(s) 1-4: "
        );

        const parts = raw
            .split(",")
            .map((p) => p.trim())
            .filter((p) => p.length > 0);

        if (parts.length === 0) {
            throw new Error(`No modes provided: "${raw}"`);
        }

        const modes = parts.map((p) => Number(p));
        const validModes = [1, 2, 3, 4];

        for (const m of modes) {
            if (!validModes.includes(m)) {
                throw new Error(`Invalid mode: ${raw}`);
            }
        }

        return [...new Set(modes)];
    }

    private async collectDocumentsFromDir(dirPath: string): Promise<Document[]> {
        const absDir = path.resolve(dirPath);
        if (!fs.existsSync(absDir) || !fs.statSync(absDir).isDirectory()) {
            throw new Error(`Directory not found: ${absDir}`);
        }

        const entries = fs.readdirSync(absDir, { withFileTypes: true });

        const fileNames = entries
            .filter((entry) => entry.isFile())
            .map((entry) => entry.name)
            .filter((name) => {
                const ext = path.extname(name).toLowerCase();
                return ext === ".pdf" || ext === ".docx";
            });

        if (fileNames.length === 0) {
            throw new Error("No .pdf or .docx files found in directory");
        }

        const requiredTypes: FileGroup[] = ["Justification", "Contract"];
        for (const type of requiredTypes) {
            if (!this.sorter.findType(fileNames, type)) {
                throw new Error(`No file found for required type: ${type}`);
            }
        }

        const results: Document[] = [];
        for (const name of fileNames) {
            const fullPath = path.join(absDir, name);
            const doc = await this.analyzer.read_document(fullPath);
            results.push(doc);
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
            const modes = await this.askModes(rl);
            console.log("Scanning and processing documents in directory...");
            const docs = await this.collectDocumentsFromDir(dirPath.trim());
            console.log(`Documents found: ${docs.length}`);

            for (const mode of modes) {
                console.log(`\nRunning analysis in Vertex AI (mode ${mode})...`);
                const result = await this.analyzer.analyze_document(docs, mode);

                console.log(`\n=== Analysis result (mode ${mode}) ===`);
                console.log(result);
            }
        } catch (error) {
            throw error;
        } finally {
            rl.close();
        }
    }
}


