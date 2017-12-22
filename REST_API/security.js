'use strict';
const { config } = require('./constants');
var acl = require('acl');

acl = new acl(new acl.memoryBackend());

const roleObjects = config.roles;
const users = config.users;

for (const ro of roleObjects) {
    acl.allow(ro.role, ro.resource, ro.method);
}

for (const user of users) {
    for (const role of user.roles) {
        acl.addUserRoles(user.user, role);
    }
}

module.exports = { acl };