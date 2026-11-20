import type { Migration } from '../migrate.ts'
import { sessionsMigration } from './0001-sessions.ts'
import { gamesMigration } from './0002-games.ts'

export const migrations: readonly Migration[] = [sessionsMigration, gamesMigration]
