import type { NextFunction, Request, Response } from 'express';

import { errorHandler } from './errorHandler';

function mockResponse(headersSent = false) {
  const res = {
    headersSent,
    status: jest.fn(),
    json: jest.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
}

const req = { log: { error: jest.fn() } } as unknown as Request;

describe('errorHandler', () => {
  it('hides internals and logs unexpected errors as 500', () => {
    const res = mockResponse();

    errorHandler(
      new Error('db password leaked'),
      req,
      res as unknown as Response,
      jest.fn() as NextFunction
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
    });
    expect(req.log.error).toHaveBeenCalled();
  });

  it('delegates to next when headers were already sent', () => {
    const res = mockResponse(true);
    const next = jest.fn();
    const err = new Error('late');

    errorHandler(err, req, res as unknown as Response, next);

    expect(next).toHaveBeenCalledWith(err);
    expect(res.status).not.toHaveBeenCalled();
  });
});
