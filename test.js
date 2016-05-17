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

var test = require('tape');
var pmtkCmds = require('./pmtk-commands');

test('PMTK Commands', function(t) {

    t.plan(8);

    t.equal(pmtkCmds.test.cmd(), '$PMTK000*32\r\n', 'PMTK_TEST');

    // Baudrate
    t.equal(pmtkCmds.setBaudrate.cmd(38400), '$PMTK251,38400*27\r\n', 'PMTK_SET_NMEA_BAUDRATE - 38400');
    t.equal(pmtkCmds.setBaudrate.cmd(0), '$PMTK251,0*28\r\n', 'PMTK_SET_NMEA_BAUDRATE - default');

    // NMEA output
    t.equal(pmtkCmds.setNmeaOutput.cmd(['GLL', 'RMC', 'VTG', 'GGA', 'GSV', 'GSA', 'ZDA']), '$PMTK314,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,0*29\r\n', 'PMTK_API_SET_NMEA_OUTPUT - many');
    t.equal(pmtkCmds.setNmeaOutput.cmd([]), '$PMTK314,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0*28\r\n', 'PMTK_API_SET_NMEA_OUTPUT - set to none');
    t.equal(pmtkCmds.resetNmeaOutput.cmd(), '$PMTK314,-1*04\r\n');
    t.throws(function () { pmtkCmds.setNmeaOutput.cmd(['zzzzzz']); }, 'PMTK_API_SET_NMEA_OUTPUT - handles errors');

    // Custom
    t.equal(pmtkCmds.custom.cmd('PMTK001,604,3'), '$PMTK001,604,3*32\r\n', 'Custom command');

    t.end();

});

test('PMTK Responses', function (t) {

    t.plan(5);

    var responseString = 'this will throw';
    t.throws(testThrow, /Invalid checksum/g, 'Throws on invalid response');
    responseString = '$PMTK001,604,0*31';
    t.throws(testThrow, /Invalid command/g, 'Throws on invalid command');
    responseString = '$PMTK001,604,1*30';
    t.throws(testThrow, /Unsupported/g, 'Throws on unsupported command');
    responseString = '$PMTK001,604,2*33';
    t.throws(testThrow, /action failed/g, 'Throws on action failed');
    t.equal(pmtkCmds.test.ackFn('$PMTK001,604,3*32'), '$PMTK001,604,3*32', 'PMTK ackFn okay');

    function testThrow() {
        pmtkCmds.test.ackFn(responseString);
    }

    t.end();
});
