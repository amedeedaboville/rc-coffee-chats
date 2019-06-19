import * as path from 'path';
import sqlite from 'better-sqlite3';

import { UserModel, UserMatchModel, MatchModel, ConfigModel } from './models';
import * as types from '../types/dbTypes';

export function initDB(
  optDbFilePath?: string,
  fileMustExist: boolean = true
): types.myDB {
  const isProd = process.env.NODE_ENV === 'production';
  const defaultDbFile = (isProd
    ? process.env.PROD_DB
    : process.env.DEV_DB) as string;

  const dbFilePath = optDbFilePath
    ? optDbFilePath
    : path.join(__dirname, '../../', 'data/', defaultDbFile);

  // Note: can set readonly, fileMustExist, timeout etc
  const DB_CONNECTION = new sqlite(dbFilePath, {
    // verbose: console.log,
    fileMustExist
  });

  console.log(`connected to database:`, { dbFilePath });

  // Initialize Models:
  const User = new UserModel(DB_CONNECTION);
  const Match = new MatchModel(DB_CONNECTION);
  const UserMatch = new UserMatchModel(DB_CONNECTION, User, Match);
  const Config = new ConfigModel(DB_CONNECTION);

  return {
    User,
    Match,
    UserMatch,
    Config,
    DB_CONNECTION
  };
}
