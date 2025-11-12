import { Db, ClientSession, Collection, Document } from "mongodb"


export default abstract class Migration
{
    protected database: Db

    protected session: ClientSession


    public constructor(database: Db, session: ClientSession)
    {
        this.database   = database
        this.session    = session
    }


    public abstract apply(): Promise<boolean>

    public abstract revert(): Promise<boolean>


    public async hasCollection(name: string): Promise<boolean>
    {
        const collections = await this.database.collections()

        return collections.some(({ collectionName }) => collectionName === name)
    }

    public createCollection<Schema extends Document>(name: string, schema: Schema): Promise<Collection<Schema>>
    {
        return this.database.createCollection<Schema>(name, {
            session: this.session,
            validator: { $jsonSchema: schema }
        })
    }

    public dropCollection(name: string): Promise<boolean>
    {
        return this.database.dropCollection(name)
    }

    public hasIndex(name: string, collection: string): Promise<boolean>
    {
        return this.database.collection(collection).indexExists(name)
    }

    public createIndex(name: string, collection: string, field: string | Array<string>, unique = false): Promise<string>
    {
        return this.database.collection(collection).createIndex(Array.isArray(field) ? field : [ field ], {
            name, unique,
            session: this.session
        })
    }

    public dropIndex(name: string, collection: string): Promise<Document>
    {
        return this.database.collection(collection).dropIndex(name)
    }
}
