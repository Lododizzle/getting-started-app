const db = require('../../src/persistence');
const updateItem = require('../../src/routes/updateItem');
const ITEM = { id: 12345 };

jest.mock('../../src/persistence', () => ({
    getItem: jest.fn(),
    updateItem: jest.fn(),
}));

test('it updates items correctly', async () => {
    const req = {
        params: { id: 1234 },
        body: { name: 'New title', completed: false },
    };
    const res = { send: jest.fn() };

    db.getItem.mockReturnValue(Promise.resolve(ITEM));

    await updateItem(req, res);

    expect(db.updateItem.mock.calls.length).toBe(1);
    expect(db.updateItem.mock.calls[0][0]).toBe(req.params.id);
    expect(db.updateItem.mock.calls[0][1]).toEqual({
        name: 'New title',
        completed: false,
    });

    expect(db.getItem.mock.calls.length).toBe(1);
    expect(db.getItem.mock.calls[0][0]).toBe(req.params.id);

    expect(res.send.mock.calls[0].length).toBe(1);
    expect(res.send.mock.calls[0][0]).toEqual(ITEM);
});

test('it returns 404 when item does not exist', async () => {
    const req = {
        params: { id: 9999 },
        body: { name: 'New title', completed: false },
    };
    const res = { sendStatus: jest.fn() };

    db.getItem.mockReturnValue(Promise.resolve(undefined));

    await updateItem(req, res);

    expect(db.updateItem).toHaveBeenCalledWith(req.params.id, {
        name: 'New title',
        completed: false,
    });

    expect(res.sendStatus).toHaveBeenCalledWith(404);
});
