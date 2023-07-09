'use strict';

const express = require('express');
const axios = require('axios');
var querystring = require('querystring');

var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

// App
const app = express();



const  itsmLogin = async () => {
  const itsmLoginRequestConstruct ={
    baseURL: "https://dev175289.service-now.com.service-now.com/oauth_token.do",
    method: "POST",
    rejectUnauthorized: false,
    data: querystring.stringify({
      grant_type: 'password',   
      client_id: '64a629f7993321108e03382a99df83e8', // Process.env.client_id  to obtain from environment variables
      client_secret: 'x:z~V6GOU~', // Process.env.client_secret  to obtain from environment variables
      username: 'admin  ', // Process.env.username  to obtain from environment variables
      password: '%n04ly!ZTvJP'  // Process.env.password  to obtain from environment variables
      }),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }      
  }
  const login = await axios.request(itsmLoginRequestConstruct)
  return login.data
}

//construct a uniue identfier for this alert , which will be later used to identify if it should update an existing or create a new incident
const constructUniqueString = (alert) => {
  return  alert.labels.alertname +"-"+ alert.labels.namespace+"-"+alert.fingerprint
}

// This is a search function to unique identify your record , which will decide to create a new or update an existing record
const searchQuery = async (login,uniqueString) => {
  const itsmSearchConstruct ={
    baseURL: "https://dev175289.service-now.com.service-now.com/api/now/table/incident",
    method: "GET",
    rejectUnauthorized: false,
    params: {
      sysparm_limit: 10,
      // In my case, I am using a unique short_description however you can choose any field
      short_description: uniqueString
    },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Bearer '+login.access_token
    }      
  }
  const searchResult = await axios.request(itsmSearchConstruct)
  console.log("Search result")
  console.log(JSON.stringify(searchResult.data))
  return searchResult.data.result
}

const createRecord = async (login,uniqueString,alert) => {

  const itsmCreateConstruct ={
    baseURL: "https://dev175289.service-now.com.service-now.com/api/now/table/incident",
    method: "POST",
    rejectUnauthorized: false,
    data: {
      "short_description": uniqueString,
      "description": alert,// can be set via prom labels like alert.labels.description 
      "work_notes": alert// can be set via prom labels like alert.labels.work_notes 
      //add more fields as you see fit , PrometheusRule labels are avaiable via alert.label.<LABEL_NAME> environment variables are available as process.env.<ENV_VARIABLE>
    },
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer '+login.access_token
    }      
  }
  const createResult = await axios.request(itsmCreateConstruct)
  console.log("Record Created")
  console.log(JSON.stringify(createResult.data))
}

const updateRecord = async (login,sys_id,alert) => {

  const itsmUpdateConstruct ={
    baseURL: "https://dev175289.service-now.com.service-now.com/api/now/table/incident/"+sys_id,
    method: "PUT",
    rejectUnauthorized: false,
    data: {
      "work_notes": alert
      //add more fields as you see fit , PrometheusRule labels are avaiable via alert.label.<LABEL_NAME> environment variables are available as process.env.<ENV_VARIABLE>
    },
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer '+login.access_token
    }      
  }
  const updateResult = await axios.request(itsmUpdateConstruct)
  console.log("Record Updated")
  console.log(JSON.stringify(updateResult.data.result))
  
}

const closeRecord = async (login,sys_id,alert) => {


  const itsmCloseConstruct ={
    baseURL: "https://dev175289.service-now.com.service-now.com/api/now/table/incident/"+sys_id,
    method: "PUT",
    rejectUnauthorized: false,
    data: {
      "work_notes": alert,
      "state": 6,
      "close_notes": "Closed with error resolved from prom", // can be set via prom labels like alert.labels.close_notes 
      "close_code": "Resolved by request" // can be set via prom labels like alert.labels.close_code 
      //add more fields as you see fit , PrometheusRule labels are avaiable via alert.label.<LABEL_NAME> environment variables are available as process.env.<ENV_VARIABLE>
    },
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer '+login.access_token
    }      
  }
  const closeResult = await axios.request(itsmCloseConstruct)
  console.log("Record Closed")
  console.log(JSON.stringify(closeResult.data.result))
  
}



const requestParse = async (body) => {
  const login = await itsmLogin();
  body.alerts.forEach(async (alert) => {
        try {    
          
                  console.log("Alert result")
                  console.log(JSON.stringify(alert))
                  const result = await searchQuery(login,constructUniqueString(alert))
                  
                  console.log("Search array")
                  console.log(JSON.stringify(result))
                  if(result.length == 0 && alert.status === "firing") {  // no record exists create new record
                    await createRecord(login,constructUniqueString(alert),alert)
                  } else if(result.length == 1 && alert.status === "firing") { // update record with last info
                    await updateRecord(login,result[0].sys_id,alert)
                  } else if(result.length == 1 && alert.status === "resolved") { // resolve record
                    await closeRecord(login,result[0].sys_id,alert)
                  } else { // somthing is wrong
                    console.log("more than 1 record found for search criteria")
                    console.log(alert)
                    console.log("Search string: "+constructUniqueString(alert))
                  }
         }
         catch (e) {
          console.log(e)
         }
    });
};



app.post('/',jsonParser, async (req, res) => {
  await requestParse(req.body)
  res.send('Success');
});

app.listen(PORT, HOST, () => {
  console.log(`Running on http://${HOST}:${PORT}`);
});