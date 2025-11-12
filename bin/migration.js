#!/usr/bin/env node

const path = require("path");
const fs = require("fs");


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


    const fullName = `M${year}_${month}_${day}_${hour}_${minute}_${second}_${name}`;

    const template = fs.readFileSync(path.resolve(process.cwd(), "templates", "migration.tpl"), { encoding: "utf-8" });

    const content = template.replaceAll(/\$\{name\}/g, fullName);

    fs.writeFileSync(path.resolve(process.cwd(), "migrations", `${fullName.toLocaleLowerCase()}.js`), content, { encoding: "utf-8" });
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
