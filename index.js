"use strict";

const functions = require("firebase-functions");
const { dialogflow, Permission } = require("actions-on-google");
const request = require("request");

const app = dialogflow();

app.intent("Location", conv => {
  conv.data.requestedPermission = "DEVICE_PRECISE_LOCATION";

  console.log("/////--->", conv)
  return conv.ask(
    new Permission({
      context: "to locate you",
      permissions: conv.data.requestedPermission
    })
  );
});
app.intent("UserInfo", (conv, params, permissionGranted) => {
  if (permissionGranted) {
    const { requestedPermission } = conv.data;
    if (requestedPermission === "DEVICE_PRECISE_LOCATION") {
      const { coordinates } = conv.device.location;
        
      if (coordinates) {
        return new Promise( function( resolve, reject ){
        getAddress(coordinates.latitude, coordinates.longitude, conv, resolve)
    });

         
      } else {
        return conv.close("Sorry, I could not figure out where you are.");
      }
    }
  } else {
    return conv.close("Sorry, permission denied.");
  }
});

function getAddress(lat, lng, conv, resolve){
    var options = {
        url: `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&sensor=true&key=AIzaSyCbWuYXy9lpIarWL4J11E_6ZBWr3BsnUQSU`,
        method: "GET"
      };
    
      request(options, function(error, response, body) {
        if (!error && response.statusCode == 200) {
          console.log(body);
          let data = JSON.parse(body);
          let message = `Your location is ${data.results[0].address_components.map(item => item.long_name).join(", ")}`;
          conv.close(message);
          resolve();
        }
      });
}

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
