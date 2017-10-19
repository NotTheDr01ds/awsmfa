var fs=require('fs');
var path=require('path');
var ini=require('ini');

filePath=path.join(process.env["HOME"],".aws/credentials");
fs.readFile(filePath, "utf-8", (err, data)=>{
  if (err) {
    console.log("Error reading " + filePath);
  } else {
    var config = ini.parse(data);
    console.log(config);
    
  }
})