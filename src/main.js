const express = require('express');
const router = express.Router();
var fs = require('fs');
var packagejs = require('../package.json');
const { exec } = require("child_process");
var path = require('path');

router.get('/generatePBIVIZ', (req, res) => {
    
    let urn  =  req.query.urn;
    packagejs.urn = urn;
    try{
        fs.writeFileSync('./package.json', JSON.stringify(packagejs, null, 2));
    }catch(err){
        console.log(err);
    }

    exec("pbiviz package", (error, stdout, stderr) => {
        if (error) {
            console.log(`error pbi pck: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`Warning: ${stderr}`);
            return;
        }
        console.log(`stdout pbi pck: ${stdout}`);

    });

 
  
    // Here I need to connect to the visual.ts module and run it. 

    res.end('This is a test to generate Power BI Forge View for this urn:' + urn);
}),



router.get('/sendDataToServer', function(req, res){
   let urn = req.query.urn;
   console.log('urn from html=' + urn);
   packagejs.urn = urn;
   try{
       fs.writeFileSync('./package.json', JSON.stringify(packagejs, null, 2));
   }catch(err){
       console.log(err);
   }

   exec("pbiviz package", (error, stdout, stderr) => {
       if (error) {
           console.log(`error pbi pck: ${error.message}`);
           return;
       }
       if (stderr) {
           console.log(`Warning: ${stderr}`);
           return;
       }
       console.log(`stdout pbi pck: ${stdout}`);

   });
   res.download(path.resolve(__dirname, '../dist/file.1.0.0.pbiviz'), (err) => {
    if (err) {
      res.status(500).send({
        message: "Could not download the file. " + err,
      });
    }
  });
   
   //res..end('This is a test to generate Power BI Forge View for this urn:' + urn); 
});

module.exports = router