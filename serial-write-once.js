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

var SerialPort = require('serialport');

/**
 * Quickly open a serial port, write something to it, wait for the response.
 * @param  {string}   device   The tty device.
 * @param  {number}   baudrate The speed of the device.
 * @param  {object}   sample   sample 'req' with 'testFn' and the 'newline' characters.
 * @param  {Function} callback The callback.  Will be: callback(err, baudrate).
 */
module.exports = function serialWriteOnce(device, baudrate, sample, callback) {
    debug('serialWriteOnce: ', device, baudrate);
    var isFirstWrite = true;
    var haveResult = false;
    var port = new SerialPort.SerialPort(device, {
        baudrate: baudrate,
        parser: SerialPort.parsers.readline(sample.newline)
    });

    port.on('data', parseSample);
    port.on('error', wrapUp);
    port.on('open', function writeSample() {
        port.write(sample.newline);
        setTimeout(function () {
            debug('serialWriteOnce -> timed out. Baudrate: ', baudrate);
            wrapUp('timeout');
        }, 2000);
    });


    function parseSample(data) {

        debug('serialWriteOnce.parseSample -> data: ', data);

        // First is just some dummy data to flush the old data out.
        if (isFirstWrite) {
            isFirstWrite = false;
            debug('serialWriteOnce.write -> write: ', sample.req);
            port.write(sample.req);
            return;
        }

        // Next we should get some valid data
        data = data.toString();
        if (sample.testFn(data)) {
            wrapUp(null, data);
            haveResult = true;
        }

    }

    function wrapUp(err, response) {
        if (haveResult) return;
        debug('serialWriteOnce.wrapUp -> err, response, baudrate: ', err, response, baudrate);
        if (port.isOpen()) {
            port.close();
        }
        callback(err, response);
    }
};

function debug() {
    if (process.env.DEBUG) {
        console.log.apply(null, arguments);
    }
}
