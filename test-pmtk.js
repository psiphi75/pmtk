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

var PMTK = require('./pmtk');
var pmtk = new PMTK('/dev/ttyO1', 'detect', function (err) {
    if (err) {
        console.log('There was an error: ', err);
    } else {
        pmtk.commands.test(stdCallbackFactory('Write test', setNmeaOutput));
    }
});

function setNmeaOutput() {
    pmtk.commands.setNmeaOutput(['GGA', 'RMC'], stdCallbackFactory('Write NMEA output', setBaudrate));
}

var first = true;
function setBaudrate() {
    var baudrate = 115200;
    if (!first) {
        baudrate = 9600;
    }
    console.log('\nSetting baudrate (' + baudrate + '):');
    pmtk.commands.setBaudrate(baudrate, function (err) {
        if (err === 'timeout') {
            console.log('Change baudrate successful: ', baudrate);
        } else if (err) {
            console.log('ERROR setting baudrate: ', err);
        }

        // Only do the next step once
        if (first) {
            newPMTK();
        }
        first = false;
    });
}

function newPMTK() {
    pmtk = new PMTK('/dev/ttyO1', 'detect', function (err) {
        if (err) {
            console.log('There was an error: ', err);
        } else {
            pmtk.commands.test(stdCallbackFactory('Write Test 2', setBaudrate));
        }
    });
}


function stdCallbackFactory(name, nextFn) {
    console.log('\nStarting ' + name + ':');
    return function (err, result) {
        if (err) {
            console.log('ERROR: ', name + ': ', err);
        } else {
            console.log(name + ' successful: ', result);
        }
        nextFn();
    };
}
