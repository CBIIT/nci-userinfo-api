const logger = require('./src/config/log');
const program = require('commander');
const assert = require('assert');
const nvModel = require('./src/model/nvModel');
const vdsModel = require('./src/model/vdsModel');
const nedModel = require('./src/model/nedModel');
const fredModel = require('./src/model/fredModel');
const consolidatedModel = require('./src/model/consolidatedModel');
const {parseOrgs} = require('./src/util/parse-orgs.js');


program
    .version('0.0.1')
    .description('User Info Management');
program
    .command('reloadVDSUsers')
    .description('Drops and reloads VDS users collection')
    .action(() => { vdsModel.reloadUsers(); });
program
    .command('updateVDSUsers')
    .description('Updates VDS users without drop')
    .action(() => { vdsModel.updateUsers(); });
program
    .command('reloadNVProperties')
    .description('Drops and reloads nVision properties collection')
    .action(() => { nvModel.reloadProperties(); });
program
    .command('updateNedChanges')
    .description('Fetches the latest NED changes')
    .action(() => { nedModel.updateNedChanges(); });
program
    .command('reloadFredUsers')
    .description('Drops and reloads Fred users')
    .action(() => { fredModel.reloadUsers(); });
program
    .command('reloadFredProperties')
    .description('Updates Fred properties')
    .action(() => { fredModel.reloadProperties(); });
program
    .command('reloadUserView')
    .description('Consolidates user information from all sources')
    .action(() => { consolidatedModel.reloadUserView(); });
program
    .command('compareFredAndVDS')
    .action(() => { consolidatedModel.compareFredAndVDS(); });
program
    .command('loadOrgs')
    .action(() => { parseOrgs(); });

program.parse(process.argv);

