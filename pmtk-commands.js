/*********************************************************************
 *                                                                   *
 *   Copyright 2016 Simon M. Werner                                  *
 *                                                                   *
 *   Licensed to the Apache Software Foundation (ASF) under one      *
 *   or more contributor license agreements.  See the NOTICE file    *
 *   distributed with this work for additional information           *
 *   regarding copyright ownership.  The ASF licenses this file      *
 *   to you under the Apache License, Version 2.0 (the               *
 *   "License"); you may not use this file except in compliance      *
 *   with the License.  You may obtain a copy of the License at      *
 *                                                                   *
 *      http://www.apache.org/licenses/LICENSE-2.0                   *
 *                                                                   *
 *   Unless required by applicable law or agreed to in writing,      *
 *   software distributed under the License is distributed on an     *
 *   "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY          *
 *   KIND, either express or implied.  See the License for the       *
 *   specific language governing permissions and limitations         *
 *   under the License.                                              *
 *                                                                   *
 *********************************************************************/

'use strict';

var PMTK_000_TEST = 'PMTK000';

var GPS_VALID_BAUDRATES = [
    0, // default setting
    4800,
    9600,
    14400,
    19200,
    38400,
    57600,
    115200,
    230400,
    460800,
    921600
];

var NMEA_TOKENS = {
    'GLL': 0,
    'RMC': 1,
    'VTG': 2,
    'GGA': 3,
    'GSA': 4,
    'GSV': 5,
    'ZDA': 17
};
var PMTK_RESET_NMEA_OUTPUT = 'PMTK314,-1';


var pmtk = {

    // PMTK test command
    test: createStandardPMTK(PMTK_000_TEST, standardAck),

    // Change baudrate
    setBaudrate: {
        cmd: setBaudrate,
        ackFn: standardAck
    },

    // Change NMEA output
    setNmeaOutput: {
        cmd: setNmeaOutput,
        ackFn: standardAck
    },
    resetNmeaOutput: createStandardPMTK(PMTK_RESET_NMEA_OUTPUT, standardAck),

    // Change the NMEA output rate
    setNmeaOutputRate: {
        cmd: setNmeaOutputRate,
        ackFn: standardAck
    },

    // Custom commands
    custom: {
        cmd: createFullStringWithCRLF,
        ackFn: function(res) { return res; }
    },

    testForPMTKinSentence: function (data) {
        var match = data.match(new RegExp('\\$PMTK[\\,\\.a-zA-Z0-9]+\\*[0-9]{2,2}'));
        return (match instanceof Array);
    },

    newline: '\r\n'
};
module.exports = pmtk;


/**
 * Factory for creating a standar PMTK Command and response.
 *
 * @param  {string} pmtkCommandPortion The PTMK command (without $, * and checksum)
 * @param  {function} ackFn            The function to parse the PMTK Acknowlegment
 * @return {object}                    A 'cmd' and 'ackFn', as provided by the import.
 */
function createStandardPMTK(pmtkCommandPortion, ackFn) {
    return {
        cmd: function () {
            return createFullStringWithCRLF( pmtkCommandPortion );
        },
        ackFn: ackFn
    };
}


/**
 * The standard Acknowlegment (PMTK001).
 * @param  {string} gpsResult The raw output from the GPS
 * @return {boolean}          True if successful.
 * @throws Error if there was an issue.
 */
function standardAck( gpsResult ) {
    var pmtkObj = getPmtkCmd(gpsResult);
    if ( !checkCheckSum( pmtkObj ) ) {
        throw new Error('Invalid checksum for: ' + gpsResult.toString());
    }
    var compontents = pmtkObj.portion.split(',');
    if (compontents.length !== 3) {
        throw new Error('Unexpected PMTK format: ' + gpsResult.toString());
    }
    if (compontents[0] !== 'PMTK001') {
        throw new Error('Not a valid acknowlegment: ' + gpsResult);
    }
    switch (compontents[2]) {
        case '0':
            throw new Error('Invalid command / packet: ', compontents[1]);
        case '1':
            throw new Error('Unsupported command / packet: ', compontents[1]);
        case '2':
            throw new Error('Valid command / packet, but action failed: ', compontents[1]);
        case '3':
            return gpsResult;
        default:
            throw new Error('Unexpected gpsResult: ', gpsResult.toString());
    }
}


/**
 * Create the PMTK sentence based on the portion (everything between the $ and the *).
 * @param  {string} portion PMTK command: everything between the $ and the *.
 * @return {string}         Complete command, including $, *, checksum and <CR><LF>.
 */
function createFullStringWithCRLF(portion) {
    return '$' + portion + '*' + pmtkChecksum(portion) + pmtk.newline;
}


/**
 * Get the PMTK portion and checksum.
 * @param  {string} pmtkSentence The raw sentence.
 * @return {object}              Object with 'portion' and 'checksum' as strings.
 */
function getPmtkCmd(pmtkSentence) {
    var $ = pmtkSentence.indexOf('$');
    var star = pmtkSentence.indexOf('*');
    if ($ === -1 || star === -1) {
        throw new Error('Invalid checksum for: ' + pmtkSentence);
    }

    return {
        portion: pmtkSentence.substring($ + 1, star),
        checksum: pmtkSentence.substring(star + 1)
    };
}

/**
 * Get the PMTK portion and checksum.
 * @param  {string} pmtkSentence The raw sentence.
 * @return {object}              Object with 'portion' and 'checksum' as strings.
 */
function checkCheckSum(pmtkObj) {
    return pmtkChecksum(pmtkObj.portion) === pmtkObj.checksum;
}


/**
 * Compute the MTK checksum and display it.  Based on code from: http://www.hhhh.org/wiml/proj/nmeaxor.html
 * @param {string} portion The pmtk portion (everything between $ and *).
 */
function pmtkChecksum( portion ) {
    // Compute the checksum by XORing all the character values in the string.
    var checksum = 0;
    for ( var i = 0; i < portion.length; i++ ) {
        checksum = checksum ^ portion.charCodeAt( i );
    }

    // Convert it to hexadecimal (base-16, upper case, most significant nybble first).
    var hexsum = Number( checksum ).toString( 16 ).toUpperCase();
    if ( hexsum.length < 2 ) {
        hexsum = ( '00' + hexsum ).slice( -2 );
    }
    return hexsum;
}


/**
 * Set the NMEA output.
 * @param {[string]} nmeaTokens The list of NMEA sentences for the GPS to return.
 * @return the NMEA sentence with $, *, checksum and <CR><LF>.
 */
function setNmeaOutput(nmeaTokens) {
    debug(nmeaTokens);
    var pmtkList = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (!(nmeaTokens instanceof Array)) {
        throw new Error('NMEA tokens must be an array of strings.');
    }
    nmeaTokens.forEach(function (token) {
        if (NMEA_TOKENS.hasOwnProperty(token)) {
            var i = NMEA_TOKENS[token];
            pmtkList[i] = 1;
        } else {
            throw new Error('Invalid NMEA token:' + token);
        }
    });
    var pmtkCmd = 'PMTK314,' + pmtkList.join();
    return createFullStringWithCRLF(pmtkCmd);
}


/**
 * Set the output rate for NMEA sentences.
 * @param {number} waitTime  How long to wait (in milliseconds).
 * @return the NMEA sentence with $, *, checksum and <CR><LF>.
 */
function setNmeaOutputRate(waitTime) {
    if (typeof waitTime !== 'number' || waitTime < 50 || waitTime > 5000) {
        throw new Error('Invalid waitTime: ' + waitTime.toString());
    }
    var pmtkCmd = 'PMTK220,' + waitTime;
    return createFullStringWithCRLF(pmtkCmd);
}


/**
 * Get the buadrate PTMK command for the GPS device.
 * @param {number} baudrate  A valid baudrate (0 is default).
 * @return the NMEA sentence with $, *, checksum and <CR><LF>.
 */
function setBaudrate(baudrate) {
    if (GPS_VALID_BAUDRATES.indexOf(baudrate) === -1 || isNaN(baudrate)) {
        throw new Error('Invalid baudrate supplied: ' + baudrate);
    }
    var pmtkCmd = 'PMTK251,' + baudrate;
    return createFullStringWithCRLF(pmtkCmd);
}

function debug() {
    if (process.env.DEBUG) {
        console.log.apply(null, arguments);
    }
}
