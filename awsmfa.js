var fs=require('fs');
var path=require('path');
var ini=require('ini');
var parseArgs=require('minimist');

var argv=parseArgs(process.argv);
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

    console.log("Switching to profile: " + awsProfile);
    console.log(config);
  }
})