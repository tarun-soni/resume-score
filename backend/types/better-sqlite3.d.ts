// Minimal ambient type to satisfy TypeScript for `better-sqlite3` in this small project.
declare module 'better-sqlite3' {
  type RunResult = { lastInsertRowid?: number; changes?: number };

  class Database {
    constructor(path: string, options?: any);
    prepare(sql: string): {
      run(...params: any[]): RunResult;
      get(...params: any[]): any;
      all(...params: any[]): any[];
    };
    exec(sql: string): void;
    close(): void;
  }

  export default Database;
}
