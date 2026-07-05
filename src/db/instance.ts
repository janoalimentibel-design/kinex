// Instancia única de la base para la app. Los tests crean las suyas con createDatabase().
import { createDatabase } from './database';

export const db = createDatabase();
