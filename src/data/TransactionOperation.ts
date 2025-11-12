import { Db, ClientSession } from "mongodb"


export type TransactionOperation<Type> = (database: Db, session: ClientSession) => Type
