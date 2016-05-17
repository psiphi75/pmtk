# PMTK

PMTK writes GPS PMTK commands to a GPS via a serial port.

## Usage

```javascript
var PMTK = require('pmtk');
var pmtk = new PMTK('/dev/ttyO1', 'detect', function (err) {
    if (err) {
        console.log('There was an error: ', err);
    } else {
        pmtk.commands.test(handleResponse);
    }
});

function handleResponse(err, result) {
    if (err) {
        console.log('Error: ', err);
    } else {
        // Prints something like: "Success: $PMTK001,0,3*30"
        console.log('Success: ', result);   
    }
}
```

## The Details

All command callbacks are standard: `callback(err, result)`.  Where:
- `err`: is an error, which could be serialport error, PTMK checksum error, or validation error.
- `result` is the PMTK response sentence.

### new PMTK(device, baudrate, callback)

Returns a PMTK object that can be used to probe the GPS. Where:

- `device`: The serial device. This will not be opened, it will only be opened when a command is sent, then it will be closed again.
- `baudrate`: A valid baudrate (e.g. 4800, 9600, ...), or 'detect'. If 'detect' is used, then the baudrate will be automatically detected, this may take a few seconds.
- `callback`: A standard callback.

### pmtk.commands.test(callback)

Send the `PMTK 000` command.  It should always respond with success.

### pmtk.commands.setBaudrate(baudrate, callback)

This will use the `PMTK 251` command to set the baudrate of the device.  `baudrate` must be a number.  You should consult the documentation for your device, but valid baudrates for some devices are: 0 (default setting), 4800, 9600, 14400, 19200, 38400, 57600, 115200, 230400, 460800, 921600.  Make sure both your GPS and local serialport can handle those baudrates.

**Important Note:** On success this will actually cause an error. The reason is that the baudrate of the serial port on the GPS device has changed and it will not detect the success PTMK setence. You will need to create a new PMTK object.

### pmtk.commands.setNmeaOutput(nmeaTokens, callback)

This will use the `PMTK 314` command to set the [NMEA sentences](http://www.gpsinformation.org/dale/nmea.htm) that the GPS device will output.

`nmeaTokens` is an array of strings.  Current valid values are:
- `'GLL'`: Lat/Lon data
- `'RMC'`: Recommended minimum data for gps
- `'VTG'`: Vector track an Speed over the Ground
- `'GGA'`: Fix information
- `'GSA'`: Overall Satellite data
- `'GSV'`: Detailed Satellite data
- `'ZDA'`: Date and Time

### pmtk.commands.resetNmeaOutput(callback)

This will use the `PMTK 314` command to set the NMEA output sentences to default.

### pmtk.commands.setNmeaOutputRate(time, callback)

This will use the `PMTK 220` command to set the rate at which NMEA sentances are output by of the GPS device.

`time` is a number in milliseconds, so to have a rate of 1 per second (1 Hz), set time to 1000.  A rate of 10 Hz would be 100.

### pmtk.commands.custom(pmtkSentence, callback)

This will use the custom `pmtkSentence`.  The callback will always return the value, a checksum will not occur.
