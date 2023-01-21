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
    baseURL: "https://dev105291.service-now.com/oauth_token.do",
    method: "POST",
    rejectUnauthorized: false,
    data: querystring.stringify({
      grant_type: 'password',
      client_id: 'd4eb1e15722021109d9fca02f0d61751',
      client_secret: 'VKdb!!8@SG',
      username: 'admin',
      password: 'DZh4rm*6hOB$'
      }),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }      
  }
  const login = await axios.request(itsmLoginRequestConstruct)
  return login.data
}


const constructUniqueString = (alert) => {
  return  alert.labels.alertname +"-"+ alert.labels.namespace+"-"+alert.fingerprint
}

const searchQuery = async (login,uniqueString) => {
  const itsmSearchConstruct ={
    baseURL: "https://dev105291.service-now.com/api/now/table/incident",
    method: "GET",
    rejectUnauthorized: false,
    params: {
      sysparm_limit: 10,
      short_description: uniqueString
    },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Bearer '+login.access_token
    }      
  }
  const searchResult = await axios.request(itsmSearchConstruct)
  return searchResult.data.result
}

const createRecord = async (login,uniqueString,alert) => {

  const itsmCreateConstruct ={
    baseURL: "https://dev105291.service-now.com/api/now/table/incident",
    method: "POST",
    rejectUnauthorized: false,
    data: {
      "short_description": uniqueString,
      "description": alert,
      "work_notes": alert
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
    baseURL: "https://dev105291.service-now.com/api/now/table/incident/"+sys_id,
    method: "PUT",
    rejectUnauthorized: false,
    data: {
      "work_notes": alert
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
    baseURL: "https://dev105291.service-now.com/api/now/table/incident/"+sys_id,
    method: "PUT",
    rejectUnauthorized: false,
    data: {
      "work_notes": alert,
      "state": 6,
      "close_notes": "Closed with error resolved from prom",
      "close_code": "Resolved by request"
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
                  console.log(alert)
                  const result = await searchQuery(login,constructUniqueString(alert))
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