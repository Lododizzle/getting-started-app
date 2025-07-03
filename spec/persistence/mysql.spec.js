const fs = require('fs');
const path = require('path');

jest.mock('wait-port', () => jest.fn(() => Promise.resolve()));

const mockQuery = jest.fn((sql, cb) => cb(null));
const mockEnd = jest.fn(cb => cb(null));

jest.mock('mysql2', () => ({
    createPool: jest.fn(() => ({
        query: mockQuery,
        end: mockEnd,
    })),
}));

const { createPool } = require('mysql2');
const db = require('../../src/persistence/mysql');

describe('mysql persistence', () => {
    const tmpDir = path.join(__dirname, 'tmp');

    beforeAll(() => {
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
    });

    afterEach(async () => {
        delete process.env.MYSQL_HOST_FILE;
        delete process.env.MYSQL_USER_FILE;
        delete process.env.MYSQL_PASSWORD_FILE;
        delete process.env.MYSQL_DB_FILE;
        mockQuery.mockClear();
        mockEnd.mockClear();
        createPool.mockClear();
    });

    afterAll(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    test('init reads secrets from files and trims newlines', async () => {
        const hostFile = path.join(tmpDir, 'host');
        const userFile = path.join(tmpDir, 'user');
        const passFile = path.join(tmpDir, 'pass');
        const dbFilePath = path.join(tmpDir, 'db');
        fs.writeFileSync(hostFile, 'localhost\n');
        fs.writeFileSync(userFile, 'root\n');
        fs.writeFileSync(passFile, 'secret\n');
        fs.writeFileSync(dbFilePath, 'todos\n');

        process.env.MYSQL_HOST_FILE = hostFile;
        process.env.MYSQL_USER_FILE = userFile;
        process.env.MYSQL_PASSWORD_FILE = passFile;
        process.env.MYSQL_DB_FILE = dbFilePath;

        await db.init();

        expect(createPool).toHaveBeenCalledWith(
            expect.objectContaining({
                host: 'localhost',
                user: 'root',
                password: 'secret',
                database: 'todos',
            })
        );

        await db.teardown();
    });
});
