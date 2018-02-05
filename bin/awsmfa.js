#! /usr/bin/env node

var fs=require('fs');
var path=require('path');
var ini=require('ini');
var parseArgs=require('minimist');
var AWS=require('aws-sdk');
var iam;

function getMFASerial() {
  return new Promise((resolve, reject) => {
    try {
      var mfaSerial=config[awsMFAProfile].mfa_serial;
    } catch (err) {
      //console.log(`Error: ${err}`);
      reject(err);
    }

    if (mfaSerial) {
      resolve(mfaSerial);
    } else {
      iam=new AWS.IAM();
      iam.listMFADevices().promise().then(
        (response) => {
          try {
            mfaSerial = response.MFADevices[0].SerialNumber;
            resolve(mfaSerial);
          } catch (err) {
            reject(err);
          }
        }
      ).catch((err) => {
        reject(err);
      })
    }
  })
}


var argv=parseArgs(process.argv, {string: ["_"]});
var tokenCode=argv._[2];
filePath=path.join(process.env["HOME"],".aws/credentials");
try {
  data=fs.readFileSync(filePath, "utf-8");
} catch (err) {
    console.log("Error reading " + filePath);
    process.exit(1);
}
var config = ini.parse(data);
if (argv['profile']) {
  awsProfile = argv['profile'];
} else if (process.env['AWS_PROFILE']) {
  awsProfile = process.env['AWS_PROFILE'];
} else {
  awsProfile = 'default';
  //console.log("Specify profile name to switch to using --profile or $AWS_PROFILE");
  //process.exit(1);
}

awsMFAProfile=awsProfile + 'mfa';
console.log("Temporarily switching to profile: " + awsMFAProfile);
var credentials = new AWS.SharedIniFileCredentials({profile: awsMFAProfile});
credentials.get(function (err) {
  if (err) {
    console.log(`Error: ${err}`);
    process.exit(1);
  }
});

AWS.config.credentials = credentials;

getMFASerial().then((mfaSerial) => {
  var sts=new AWS.STS();
  var stsParams={
    DurationSeconds: 7200,
    SerialNumber: mfaSerial,
    TokenCode: tokenCode
  };
  sts.getSessionToken(stsParams,function (err,data) {
    if (err) {
      //console.log(err, err.stack);
      console.log(`${err.code}: ${err.message}`);
      process.exit(5);
    }
    else {
      config[awsProfile].aws_access_key_id=data.Credentials.AccessKeyId;
      config[awsProfile].aws_secret_access_key=data.Credentials.SecretAccessKey;
      config[awsProfile].aws_session_token=data.Credentials.SessionToken;
      try {
        fs.writeFileSync(filePath, ini.stringify(config));
        console.log(`Updated ~/.aws/credentials for ${awsProfile}`)
      } catch (err) {
        console.log(err);
        process.exit(3);
      }
    }
  });
}).catch((err) => {
  console.log(err);
})


