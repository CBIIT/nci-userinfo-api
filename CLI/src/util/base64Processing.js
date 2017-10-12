const config = require(process.env.NODE_CONFIG_FILE_API);
const base64LdapFields = config.vds.base64LdapFields;


/** Converts specific fields in an LDAP result entry to  to base64.
 * @input entry 
 */
const convertBase64Fields = (entry) => {
    let obj = entry.object;
    const raw = entry.raw;

    base64LdapFields.forEach( field => {
        let base64Field = raw[field];
        if (base64Field) {
            obj[field] = base64Field.toString('base64');
        }
    });

    return obj;

};

module.exports = { convertBase64Fields };