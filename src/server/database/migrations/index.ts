import type { Migration } from '../migrate.ts'
import { sessionsMigration } from './0001-sessions.ts'

export const migrations: readonly Migration[] = [sessionsMigration]
