import { MongoClient } from "mongodb"


export default class Connection
{
    protected host: string

    protected port: number


    public constructor(host: string, port: number)
    {
        this.host = host
        this.port = port
    }

    public connect(database: string, user: string, password: string): Promise<MongoClient>
    {
        const client = new MongoClient(this.createURL(database, user, password))

        return client.connect()
    }

    protected createURL(database: string, user: string, password: string): string
    {
        return `mongodb://${user}:${password}@${this.host}:${this.port}/${database}`
    }

    public static create(host: string, port: number): Connection
    {
        return new Connection(host, port)
    }
}
