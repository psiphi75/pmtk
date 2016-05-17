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

var pmtkCmds = require('./pmtk-commands');
var serialWriteOnce = require('./serial-write-once');

function PMTK(device, baudrate, callback) {
    this.baudrate = baudrate || 9600;
    this.device = device;
    this.commands = applyFuncs(this, pmtkCmds);
    this.isWaitingForResponse = false;

    if (baudrate === 'detect') {
        autoDetectBaudrate(this, callback);
    } else {
        setTimeout(callback, 0);
    }

}

function autoDetectBaudrate(self, callback) {
    var detector = require('./detect-baudrate');
    var sample = {
        req: '$PMTK000*32' + pmtkCmds.newline,
        testFn: function (data) {
            var match = data.match(new RegExp('[\\$\\,\\*\\.a-zA-Z0-9]+'));
            return (match instanceof Array && match[0].length === data.length);
        },
        newline: pmtkCmds.newline
    };
    detector.start(this.device, sample, function(err, baudrate) {
        if (err) {
            callback(err);
        } else {
            debug('PMTK.autoDetectBaudrate -> baudrate set to: ', baudrate);
            self.baudrate = baudrate;
            callback(null, baudrate);
        }
    });
}

function applyFuncs(self) {
    var result = {};
    for (var cmdName in pmtkCmds) {
        var pCmd = pmtkCmds[cmdName];
        var reqCmd = pCmd.cmd;
        var resCmd = pCmd.ackFn;
        result[cmdName] = pmtkFuncFactory(self, reqCmd, resCmd);
    }
    return result;
}

function pmtkFuncFactory(self, reqCmd, resCmd) {

    return function () {

        var callback = arguments[arguments.length - 1];

        if (self.isWaitingForResponse) {
            callback('Already waiting for response from GPS device.');
            return;
        }
        self.isWaitingForResponse = true;

        var sample = {
            req: reqCmd(arguments[0]), // FIXME: Should be able to handle multiple args. BUt this is okay until pmtk-commands gets extended such that there  is a command with >1 args
            testFn: pmtkCmds.testForPMTKinSentence,
            newline: pmtkCmds.newline
        };

        serialWriteOnce(self.device, self.baudrate, sample, function (err, response) {
            debug('Starting serialWriteOnce', self.device, self.baudrate, JSON.stringify(sample), response);
            self.isWaitingForResponse = false;
            if (err) {
                callback(err);
            } else {
                try {
                    callback(null, resCmd(response));
                } catch (ex) {
                    callback(ex);
                }
            }
        });

    };
}


function debug() {
    if (process.env.DEBUG) {
        console.log.apply(null, arguments);
    }
}

module.exports = PMTK;
