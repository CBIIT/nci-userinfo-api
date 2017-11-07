const program = require('commander');
const assert = require('assert');
const { reloadUsers, reloadProperties, reloadFredUsers, updateUsers, updateNedChanges } = require('./src/model/model');


program
    .version('0.0.1')
    .description('User Info Management');

program
    .command('reloadUsers')
    .description('Drops and reloads users collection')
    .action(reloadUsers);
program
    .command('reloadProperties')
    .description('Drops and reloads properties collection')
    .action(() => {
        reloadProperties();
    });
program
    .command('reloadFredUsers')
    .description('Drops and reloads Fred users')
    .action(() => {
        reloadFredUsers();
    });
program
    .command('updateUsers')
    .description('Updates VDS users')
    .action(() => {
        updateUsers();
    });
program
    .command('updateNedChanges')
    .description('Fetches the latest NED changes')
    .action(() => {
        updateNedChanges();
    });

program.parse(process.argv);

