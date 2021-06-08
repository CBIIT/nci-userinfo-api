'use strict';
const { getUsersGraphQL } = require('../connectors/vdsConnector');
const { getUsersByIc } = require('./db.js');
const { buildSchema } = require('graphql');

const { getPropertiesForUser } = require('./db');

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
        effective_start_date: String,
        effective_end_date: String,
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
        effective_start_date: String,
        effective_end_date: String,
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
        usersLocal(ic: String): [BasicUser],
        user(id: String): User,
        hello: String
    }
`);

const root = {

    users: async (ic) => {
        const users = await getUsersGraphQL(null, ic.ic);
        return users;
    },

    usersLocal: async(ic) => {
        const users = await getUsersByIc(ic.ic);
        return users;
    },

    user: async (id) => {
        const users = await getUsersGraphQL(id.id, '*');
        const user = users.length > 0 ? users[0] : null;

        if (user) {
            // get the associated user accounts - manager, POC, etc.
            if (user.administrative_officer_id) {
                const result = await getUsersGraphQL(user.administrative_officer_id, '*');
                if (result.length > 0) {
                    user.administrative_officer = result[0];
                }
            }

            if (user.point_of_contact_id) {
                const result = await getUsersGraphQL(user.point_of_contact_id, '*');
                if (result.length > 0) {
                    user.point_of_contact = result[0];
                }
            }

            if (user.manager_id) {
                const result = await getUsersGraphQL(user.manager_id, '*');
                if (result.length > 0) {
                    user.manager = result[0];
                }
            }

            if (user.cotr_id) {
                const result = await getUsersGraphQL(user.cotr_id, '*');
                if (result.length > 0) {
                    user.cotr = result[0];
                }
            }

            user.properties = await getPropertiesForUser(user.ned_id, '*');
        }
        return user;
    },

    hello: () => 'Hello There!'

};

module.exports = { schema, root };
