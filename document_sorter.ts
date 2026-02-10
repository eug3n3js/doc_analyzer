export type FileGroup = "Justification" | "Contract" | "Additional";


export class DocumentSorter {
    private readonly justificationPattern = /([об]*грунтування|obgr)/i;
    private readonly contractPattern = /(договор|договір|dogovir|проєкт|проект)/i;

    public categorize(fileName: string): FileGroup {
        if (this.justificationPattern.test(fileName)) {
            return "Justification";
        } else if (this.contractPattern.test(fileName)) {
            return "Contract";
        } else {
            return "Additional";
        }
    }

    public checkType(fileName: string, fileType: FileGroup): boolean {
        return this.categorize(fileName) === fileType;
    }

    public findType(fileNames: string[], fileType: FileGroup): boolean {
        for (const fileName of fileNames) {
            if (this.checkType(fileName, fileType)) {
                return true;
            }
        }
        return false;
    }

}
