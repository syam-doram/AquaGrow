import mongoose from 'mongoose';

/**
 * Execute a callback inside a MongoDB transaction session.
 * The callback receives the session and should perform all DB ops using it.
 * If the callback throws, the transaction is aborted and the error propagated.
 */
export async function withTransaction<T>(fn: (session: mongoose.ClientSession) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession();
  try {
    let result: T;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    // @ts-ignore - result is assigned inside transaction closure
    return result!;
  } finally {
    await session.endSession();
  }
}
