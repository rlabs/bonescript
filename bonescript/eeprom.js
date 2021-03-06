var fs = require('fs');
var buffer = require('buffer');
var util = require('util');

var readEeproms = function() {
    var data = {};
    var addresses = ['3-0054', '3-0055', '3-0056', '3-0057'];
    var cape = null;
    var main = null;
    var raw = fetchEepromData('1-0050');
    if(raw) {
        main = parseMainEeprom(raw);
    }
    if(main) {
        data.main = main;
    }
    for(var address in addresses) {
        raw = fetchEepromData(addresses[address]);
        if(raw) {
            cape = parseCapeEeprom(raw);
            if(cape) {
                data[addresses[address]] = cape;
            }
        }
    }
    return(data);
};

var fetchEepromData = function(address) {
    var eepromData = new buffer.Buffer(256);
    try {
        var eepromFile =
            fs.openSync(
                '/sys/bus/i2c/drivers/at24/'+address+'/eeprom',
                'r'
            );
        fs.readSync(eepromFile, eepromData, 0, 256, 0);
        console.log('Reading EEPROM at '+address);
        return(eepromData);
    } catch(ex) {
        console.warn('Unable to open EEPROM at '+address+': '+ex);
        return(null);
    }
};

var parseMainEeprom = function(x) {
    var data = {};
    data.header = x.toString('base64', 0, 4);
    if(data.header != 'qlUz7g==') {
        console.error('Unknown EEPROM format: '+data.header);
        return(null);
    }
    data.boardName = x.toString('ascii', 4, 12);
    data.version = x.toString('ascii', 12, 16);
    data.serialNumber = x.toString('ascii', 16, 28);
    data.configOption = x.toString('base64', 28, 60);
    return(data);
};

var parseCapeEeprom = function(x) {
    var data = {};
    data.header = x.toString('base64', 0, 4);
    if(data.header != 'qlUz7g==') {
        console.error('Unknown EEPROM format: '+data.header);
        return(null);
    }
    data.formatRev = x.toString('ascii', 4, 6);
    if(data.formatRev != 'A0') {
        console.error('Unknown EEPROM format revision: '+data.formatRev);
        return(null);
    }
    data.boardName = x.toString('ascii', 6, 38);
    data.version = x.toString('ascii', 38, 42);
    data.manufacturer = x.toString('ascii', 42, 58);
    data.partNumber = x.toString('ascii', 58, 74);
    data.numPins = parseInt(x[74]) * 16 + parseInt(x[75]);
    data.serialNumber = x.toString('ascii', 76, 88);
    data.currentVDD_3V3EXP = parseInt(x[228]) * 16 + parseInt(x[229]);
    data.currentVDD_5V = parseInt(x[230]) * 16 + parseInt(x[231]);
    data.currentSYS_5V = parseInt(x[232]) * 16 + parseInt(x[233]);
    data.DCSupplied = parseInt(x[234]) * 16 + parseInt(x[235]);
    return(data);
};

console.log(readEeproms());
