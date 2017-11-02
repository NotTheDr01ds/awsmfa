var fs=require('fs');
var path=require('path');
var ini=require('ini');
var parseArgs=require('minimist');
var AWS=require('aws-sdk');

var argv=parseArgs(process.argv, {string: ["_"]});
var tokenCode=argv._[2];
filePath=path.join(process.env["HOME"],".aws/credentials");
fs.readFile(filePath, "utf-8", (err, data)=>{
  if (err) {
    console.log("Error reading " + filePath);
    process.exit(1);
  } else {
    var config = ini.parse(data);
    if (argv['profile']) {
      awsProfile = argv['profile'];
    } else if (process.env['AWS_PROFILE']) {
      awsProfile = process.env['AWS_PROFILE'];
    } else {
      console.log("Specify profile name to switch to using --profile or $AWS_PROFILE");
      process.exit(1);
    }

    awsMFAProfile=awsProfile + 'mfa';
    console.log("Temporarily switching to profile: " + awsMFAProfile);
    var credentials = new AWS.SharedIniFileCredentials({profile: awsMFAProfile});
    credentials.get(function (err) {
      if (err) {
        console.log(`Error: ${err}`);
        process.exit(2);
      }
    });

    AWS.config.credentials = credentials;

    var mfaSerial=config[awsMFAProfile].mfa_serial;
    var sts=new AWS.STS();
    var stsParams={
      DurationSeconds: 7200,
      SerialNumber: mfaSerial,
      TokenCode: tokenCode
    };
    sts.getSessionToken(stsParams,function (err,data) {
      if (err) console.log(err,err.stack);
      else console.log(data);
    });

  }
})