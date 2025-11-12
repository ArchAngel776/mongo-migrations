import { MongoClient, ClientSession, Db } from "mongodb"
import { TransactionOperation } from "@data/TransactionOperation"


export default class Transaction
{    
    protected database: Db

    protected session: ClientSession


    public constructor(client: MongoClient, database: Db)
    {
        this.database   = database;
        this.session    = client.startSession()
    }

    public begin(): void
    {
        this.session.startTransaction()
    }

    public async make<Type>(operation: TransactionOperation<Type>): Promise<Type>
    {
        try
        {
            const result = await operation(this.database, this.session)
            return result
        }
        catch (error)
        {
            await this.rollback()
            throw error
        }
    }

    public async commit()
    {
        try
        {
            await this.session.commitTransaction()
        }
        catch (error)
        {
            await this.rollback()
            throw error
        }
    }

    public async rollback(): Promise<void>
    {
        await this.session.abortTransaction()
    }

    public get getSession(): ClientSession
    {
        return this.session
    }
}
