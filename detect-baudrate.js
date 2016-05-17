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

var async = require('async');
var serialWriteOnce = require('./serial-write-once');

var validRates = [
    115200,
    9600,
    4800,
    14400,
    19200,
    38400,
    57600,
];

/**
 * Start the baudrate detection.
 * @param  {string}   device   The tty device
 * @param  {object}   sample   sample 'req' with 'res' and the 'newline' characters
 * @param  {Function} callback The callback.  Will be: callback(err, baudrate)
 */
exports.start = function detectBaudrate(device, sample, callback) {

    var fns = [];
    for (var i in validRates) {
        var baudrate = validRates[i];
        fns.push(fnFactory(device, sample, baudrate));
    }
    async.series(fns, function (result) {
        debug('detect-baudrate.fns -> async result: ', result);
        if (typeof result === 'number') {
            // Found the baudrate
            callback(null, result);
        } else {
            // Did not find the baudrate (error)
            callback(result);
        }
    });


    function fnFactory(_device, _sample, _baudrate) {
        return function (asyncCB) {
            serialWriteOnce(_device, _baudrate, _sample, function (err) {
                if (err === 'timeout') {
                    // Tell async to go to next function
                    asyncCB(null);
                } else if (err) {
                    // There was an actual error
                    asyncCB(err);
                } else {
                    // Tell async that we found it
                    asyncCB(_baudrate);
                }
            });
        };
    }

};

function debug() {
    if (process.env.DEBUG) {
        console.log.apply(null, arguments);
    }
}
