'use strict';
const { getUsersGraphQL, getUserGraphQLMongo } = require('../connectors/vdsConnector');
// const js2xmlparser = require('js2xmlparser2');
const { buildSchema } = require('graphql');

// var parserOptions = {
//     wrapArray: {
//         enabled: true
//     }
// };


const schema = buildSchema(`
    type User {
        ned_id: String,
        distinguished_name: [String],
        inactive: Boolean,
        first_name: String,
        middle_name: String,
        last_name: String,
        email: String,
        phone: String,
        locality: String,
        site: String,
        building: String,
        room: String,
        division: String,
        status: String,
        title: String,
        sac: String,
        cotr: User,
        administrative_officer: User,
        manager: User,
        point_of_contact: User,
        properties: [Property],
        member_of: [String],
    }

    type BasicUser {
        ned_id: String,
        distinguished_name: [String],
        inactive: Boolean,
        first_name: String,
        middle_name: String,
        last_name: String,
        email: String,
        phone: String,
        locality: String,
        site: String,
        building: String,
        room: String,
        division: String,
        status: String,
        title: String,
        sac: String,
        cotr_id: String,
        administrative_officer_id: String,
        manager_id: String,
        point_of_contact_id: String,
        properties: [Property],
        member_of: [String],
    }

    type Property {
        ASSET_DECAL_NBR: String,
        OFFICIAL_NM: String,
        MANUFACTURER_NM: String,
        MODEL_NBR: String,
        SERIAL_NBR: String
    }

    type Query {
        users(ic: String): [BasicUser],
        user(id: String): User,
        hello: String
    }
`);

const root = {
    // users: (ic) => {
    //     return {

    //         email: 'svetoslav.yankov@nih.gov',
    //         building: '9609',
    //         memberOf: [
    //             'CN=NCI CBIIT Engineering IAM Account Managers,OU=Distribution Lists,OU=NCI,OU=NIH,ou=ad,dc=nih,dc=gov',
    //             'CN=NCI-Frederick DCTD APPS,OU=Groups,OU=NCI-Frederick,OU=NIH,ou=ad,dc=nih,dc=gov'
    //         ]
    //     };
    // },

    users: async (ic) => {
        console.log(`requesting ${ic.ic} users`);
        const users = await getUsersGraphQL(null, ic.ic);
        return users;
    },

    user: async (id) => {
        // console.log(`id: ${id.id}`);
        const user = await getUserGraphQLMongo(id.id);
        // console.log(user[0]);
        // return js2xmlparser('user', users, parserOptions);
        return user;
        // return await getUsersGraphQL(id, 'NCI', null);
    },

    hello: () => 'Hello There!'

};

module.exports = { schema, root };