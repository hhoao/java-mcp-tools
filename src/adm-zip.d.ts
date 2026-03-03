declare module "adm-zip" {
  interface IZipEntry {
    entryName: string;
    isDirectory: boolean;
    getData(): Buffer;
  }
  export default class AdmZip {
    constructor(path: string);
    getEntries(): IZipEntry[];
    getEntry(name: string): IZipEntry | null;
  }
}
