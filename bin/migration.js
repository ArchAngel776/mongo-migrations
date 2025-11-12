#!/usr/bin/env node

const path = require("path");
const fs = require("fs");

const { Connection } = require("../build/index");


const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS } = process.env


const YEAR_LENGTH   = 4;
const MONTH_LENGTH  = 2;
const DAY_LENGTH    = 2;

const HOUR_LENGTH   = 2;
const MINUTE_LENGTH = 2;
const SECOND_LENGTH = 2;



function zeroLeading(target, length)
{
    let result = `${target}`;

    while (result.length < length)
    {
        result = `0${result}`;
    }

    return result;
}


/**
 * Exception occured during command's type recognisation.
 * 
 * @extends {Error}
 */
class MigrationCommandException extends Error
{
    /**
     * Initialize exception
     * 
     * @param {string} command 
     */
    constructor(command)
    {
        super(`Command type "${command}" is unrecognised migration's action.`);

        this.name = "Migration: Command exception";
    }
}


/**
 * Exception occured when migration's name is undefined.
 * 
 * @extends {Error}
 */
class MigrationNameException extends Error
{
    /**
     * Initialize exception
     */
    constructor()
    {
        super("Migration's name has not been specified.");

        this.name = "Migration: Name exception";
    }
}


/**
 * Prepare database structure for migrations system.
 * 
 * @returns {Promise<void>}
 */
async function install()
{
    const client = await Connection.create(DB_HOST, DB_PORT).connect(DB_NAME, DB_USER, DB_PASS);


    const db = client.db(DB_NAME);

    const collections = await db.collections();

    if (collections.some(({ collectionName }) => collectionName === "migrations"))
    {
        console.log("Migrations system has been already installed.");
        console.log("No action needed.");

        return;
    }


    await db.createCollection("migrations", {
        validator: {
            $jsonSchema: {
                title: "Database migrations validator",
                bsonType: "object",
                required: ["_id", "migration_name", "created_at"],
                properties: {
                    _id: {
                        bsonType: "objectId",
                        description: "'_id' must be valid ObjectID object"
                    },
                    migration_name: {
                        bsonType: "string",
                        description: "name of migration must be valid string type"
                    },
                    created_at: {
                        bsonType: "date",
                        description: "'created_at' param must be valid date"
                    }
                },
                additionalProperties: false
            }
        }
    });

    await db.collection("migrations").createIndex({ migration_name: 1 }, {
        name: "migration",
        unique: true
    });


    await client.close();

    console.log("Migrations system installed successfully.");
}


/**
 * Create a new migration file.
 * 
 * @param {string} name
 * @returns {void}
 */
function create(name)
{
    const date = new Date;

    const year      = zeroLeading(date.getFullYear(),   YEAR_LENGTH);
    const month     = zeroLeading(date.getMonth() + 1,  MONTH_LENGTH);
    const day       = zeroLeading(date.getDate(),       DAY_LENGTH);

    const hour      = zeroLeading(date.getHours(),      HOUR_LENGTH);
    const minute    = zeroLeading(date.getMinutes(),    MINUTE_LENGTH);
    const second    = zeroLeading(date.getSeconds(),    SECOND_LENGTH);


    const fullName = `M${year}${month}${day}_${hour}${minute}${second}_${name}`;

    const template = fs.readFileSync(path.resolve(process.cwd(), "templates", "migration.tpl"), { encoding: "utf-8" });

    const content = template.replaceAll(/\$\{name\}/g, fullName);

    fs.writeFileSync(path.resolve(process.cwd(), "migrations", `${fullName.toLocaleLowerCase()}.js`), content, { encoding: "utf-8" });

    console.log(`Migration "${fullName}" successfully created.`);
}


/**
 * Main execution function of CLI.
 * 
 * @async
 * @param {string} command 
 * @param {string[]} args
 * @returns {Promise<void>}
 * @throws {MigrationCommandException}
 */
async function main(command, args)
{
    switch (command)
    {
        case "install":
        {
            await install();
            break;
        }
        case "create":
        {
            const [ name ] = args;

            if (!name)
            {
                throw new MigrationNameException;
            }

            create(name);
            break;
        }
        default:
        {
            throw new MigrationCommandException(command);
        }
    }
}


const [ command, ...args ] = process.argv.toSpliced(0, 2);


main(command, args)
    .then(() => {
        process.exit(0);
    })
    .catch(exception => {
        console.error(`${exception.name}: ${exception.message}`);
        process.exit(1);
    });
