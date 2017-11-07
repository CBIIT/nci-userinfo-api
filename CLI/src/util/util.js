module.exports = {
    ts: function () {
        var now = new Date();
        return 'TS(UTC):' + now.getTime() + ' ### ' + now.toLocaleString() + ' ### ';
    },


    DeepTrim: function (obj) {
        for (var prop in obj) {
            var value = obj[prop],
                type = typeof value;
            if (value != null && (type == 'string' || type == 'object') && obj.hasOwnProperty(prop)) {
                if (type == 'object') {
                    this.DeepTrim(obj[prop]);
                } else {
                    obj[prop] = obj[prop].trim();
                    if (prop == 'dn' || prop == 'cn' || prop == 'mail') {
                        obj[prop] = obj[prop].toLowerCase();
                    }
                }
            }
        }
        return obj;
    },

    ArrayArize: function (obj) {
        var type;
        var array;
        var value;
        value = obj['groupMembership'];
        type = typeof value;
        if (type == 'string') {
            array = [];
            array.push(value);
            obj['groupMembership'] = array;
        }

        value = obj['objectClass'];
        type = typeof value;
        if (type == 'string') {
            array = [];
            array.push(value);
            obj['objectClass'] = array;
        }

        return obj;
    },

    extractUsername: function (dn) {
        var start = dn.split('=')[1];
        var result = start.substring(0, start.indexOf(',')).trim();

        return result;
    },

    getCurrentDate: () => {

        const pad = (value) => {
            return value >= 10 ? value : '0' + value;
        };

        const date = new Date();
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const hour = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        const seconds = pad(date.getSeconds());
        return { date: year + '-' + month + '-' + day, time: hour + ':' + minutes + ':' + seconds };
    }

};