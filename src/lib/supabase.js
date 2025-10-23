// Reexport para compatibilidad con imports antiguos que apuntaban a este archivo.
// Reexporta el cliente neutral definido en `src/lib/dbClient.js`.
import { dbClient, getServiceClient } from './dbClient';

export const client = dbClient;
export const getService = getServiceClient;

