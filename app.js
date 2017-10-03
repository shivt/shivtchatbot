//BACKUP

/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

/*var restify = require('restify');
var builder = require('botbuilder');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    stateEndpoint: process.env.BotStateEndpoint,
    openIdMetadata: process.env.BotOpenIdMetadata 
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());*/

/*----------------------------------------------------------------------------------------
* Bot Storage: This is a great spot to register the private state storage for your bot. 
* We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
* For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
* ---------------------------------------------------------------------------------------- */

// Create your bot with a function to receive messages from the user
/*var bot = new builder.UniversalBot(connector, function (session) {
    session.send("You said Me: %s", session.message.text);
});*/
var restify = require('restify');
var builder = require('botbuilder');


// MYSQL DB STARTS

var mysql      = require('mysql'); 
var connection = mysql.createConnection({  
  host     : 'localhost',  
  user     : 'root',  
  password : 'password',  
  database : 'CHATBOT'  
});

connection.connect(function(err) {
    if (err) throw err

});

function getUserDetail(user_id, callback){
    connection.query("SELECT * FROM STUDENT WHERE STUDENT_ID ='"+user_id+"'", function(err, rows, fields)   
    {  
      if (err){
          console.log(err);
      } 
      else {
          if(rows.length ==0){
            connection.query("SELECT * FROM FACULTY WHERE FACULTY_ID ='"+user_id+"'", function(err, rows1, fields) 
            {
                  if (err){
                console.log(err);
                } else{
                    if(rows1.length ==1){
                    callback(rows1[0].FACULTY_NAME, 'Faculty');
                  }
                  else{
                     callback(null, null); 
                  }
                }
            }); 
          }
          else{
          callback(rows[0].STUDENT_NAME, 'Student');        
        }
      }
    }); 
}

function getUpcomingSceduleForDay (user_id, type, callback){
  var query;
  if(type=='Student'){
    query="SELECT C.COURSE_NAME , DATE_FORMAT(BEGIN_TIME, '%h:%i %p') AS START_TIME , DATE_FORMAT(END_TIME, '%h:%i %p') AS END_TIME, (SELECT FACULTY_NAME FROM FACULTY F, FACULTY_COURSE FC WHERE F.FACULTY_ID = FC.FACULTY_ID AND FC.COURSE_ID=C.COURSE_ID ) as FACULTY  FROM COURSE_SCHEDULE CS, COURSE C WHERE CS.COURSE_ID = C.COURSE_ID AND  CS.COURSE_ID IN (SELECT COURSE_ID FROM STUDENT_COURSE WHERE STUDENT_ID ='"+user_id+"')AND  CS.BEGIN_TIME > CURRENT_TIMESTAMP AND DATE_FORMAT(CS.END_TIME, '%d-%m-%y') =DATE_FORMAT(CURRENT_TIMESTAMP, '%d-%m-%y') AND CS.STATUS ='A'";
  }
  else if(type=='Faculty'){
    query="SELECT C.COURSE_NAME , DATE_FORMAT(BEGIN_TIME, '%h:%i %p') AS START_TIME , DATE_FORMAT(END_TIME, '%h:%i %p') AS END_TIME FROM COURSE_SCHEDULE CS, COURSE C WHERE CS.COURSE_ID = C.COURSE_ID AND  CS.COURSE_ID IN (SELECT COURSE_ID FROM FACULTY_COURSE WHERE FACULTY_ID ='"+user_id+"')AND  CS.BEGIN_TIME > CURRENT_TIMESTAMP AND DATE_FORMAT(CS.END_TIME, '%d-%m-%y') =DATE_FORMAT(CURRENT_TIMESTAMP, '%d-%m-%y') AND CS.STATUS ='A'";
  }
  connection.query(query, function(err, rows, fields)   
    { 
          if (err){
                console.log(err);
                }
          else{
            console.log(rows);
            callback(rows);
          }
    });
  }


function getSceduleForNumberOfDays(user_id, noOfDays, type, callback){

  var query;
  if(type=='Student'){
    query="SELECT C.COURSE_NAME , DATE_FORMAT(CS.BEGIN_TIME, '%d-%b-%Y') DATE, DATE_FORMAT(BEGIN_TIME, '%h:%i %p') AS START_TIME , DATE_FORMAT(END_TIME, '%h:%i %p') AS END_TIME , (SELECT FACULTY_NAME FROM FACULTY F, FACULTY_COURSE FC WHERE F.FACULTY_ID = FC.FACULTY_ID AND FC.COURSE_ID=C.COURSE_ID ) as FACULTY FROM COURSE_SCHEDULE CS, COURSE C WHERE CS.COURSE_ID = C.COURSE_ID AND  CS.COURSE_ID IN (SELECT COURSE_ID FROM STUDENT_COURSE WHERE STUDENT_ID ='"+user_id+"')AND  CS.BEGIN_TIME > CURRENT_TIMESTAMP AND CS.BEGIN_TIME  <= NOW() + INTERVAL "+noOfDays+" DAY AND CS.BEGIN_TIME >= NOW() + INTERVAL 1 DAY AND CS.STATUS ='A' ORDER BY CS.BEGIN_TIME";
  }
  else if(type=='Faculty'){
    query="SELECT C.COURSE_NAME , DATE_FORMAT(CS.BEGIN_TIME, '%d-%b-%Y') DATE, DATE_FORMAT(BEGIN_TIME, '%h:%i %p') AS START_TIME , DATE_FORMAT(END_TIME, '%h:%i %p') AS END_TIME FROM COURSE_SCHEDULE CS, COURSE C WHERE CS.COURSE_ID = C.COURSE_ID AND  CS.COURSE_ID IN (SELECT COURSE_ID FROM FACULTY_COURSE WHERE FACULTY_ID ='"+user_id+"')AND  CS.BEGIN_TIME > CURRENT_TIMESTAMP AND CS.BEGIN_TIME  <= NOW() + INTERVAL "+noOfDays+" DAY AND CS.BEGIN_TIME >= NOW() + INTERVAL 1 DAY AND CS.STATUS ='A' ORDER BY CS.BEGIN_TIME";
  }
  connection.query(query, function(err, rows, fields)   
    { 
          if (err){
                console.log(err);
                }
          else{
            console.log(rows);
            callback(rows);
          }
    });
}


function cancelScheduleForNumberOfDays(user_id, noOfDays){

  var query="UPDATE COURSE_SCHEDULE SET STATUS = 'I' WHERE COURSE_ID IN (SELECT COURSE_ID FROM FACULTY_COURSE WHERE FACULTY_ID ='"+user_id+"') AND  BEGIN_TIME >= CURRENT_TIMESTAMP AND BEGIN_TIME  <= NOW() + INTERVAL "+noOfDays+" DAY AND STATUS ='A'";
  console.log(query);
  connection.query(query, function(err, results)   
    { 
          if (err){
                console.log(err);
                }
          else{
            console.log(results.affectedRows);            
          }
    });
}


function cancelScheduleForADate(user_id, date){

  var query="UPDATE COURSE_SCHEDULE SET STATUS = 'I' WHERE COURSE_ID IN (SELECT COURSE_ID FROM FACULTY_COURSE WHERE FACULTY_ID ='"+user_id+"') AND DATE_FORMAT(BEGIN_TIME, '%m/%d/%Y') ='"+date+"' AND STATUS ='A'";
  console.log(query);
  connection.query(query, function(err, results)   
    { 
          if (err){
                console.log(err);
                }
          else{
            console.log(results.affectedRows);            
          }
    });
}


function cancelScheduleForCourse(user_id, course){

  var query="UPDATE COURSE_SCHEDULE SET STATUS = 'I' WHERE COURSE_ID IN (SELECT COURSE_ID FROM FACULTY_COURSE WHERE FACULTY_ID ='"+user_id+"') AND BEGIN_TIME >= NOW()  AND COURSE_ID IN (SELECT COURSE_ID FROM COURSE WHERE UPPER(COURSE_NAME) LIKE UPPER('%"+course+"%')) AND STATUS ='A'";
  console.log(query);
  connection.query(query, function(err, results)   
    { 
          if (err){
                console.log(err);
                }
          else{
            console.log(results.affectedRows);            
          }
    });
}



function getSceduleForSpecifiedDate(user_id, date, type, callback){

  var query;
  if(type=='Student'){
    query="SELECT C.COURSE_NAME , DATE_FORMAT(CS.BEGIN_TIME, '%d-%b-%Y') DATE, DATE_FORMAT(BEGIN_TIME, '%h:%i %p') AS START_TIME , DATE_FORMAT(END_TIME, '%h:%i %p') AS END_TIME FROM COURSE_SCHEDULE CS, COURSE C WHERE CS.COURSE_ID = C.COURSE_ID AND  CS.COURSE_ID IN (SELECT COURSE_ID FROM STUDENT_COURSE WHERE STUDENT_ID ='"+user_id+"') AND DATE_FORMAT(CS.BEGIN_TIME, '%m/%d/%Y') ='"+date+"' AND CS.STATUS ='A' ORDER BY CS.BEGIN_TIME";
  }
  else if(type=='Faculty'){    
    query="SELECT C.COURSE_NAME , DATE_FORMAT(CS.BEGIN_TIME, '%d-%b-%Y') DATE, DATE_FORMAT(BEGIN_TIME, '%h:%i %p') AS START_TIME , DATE_FORMAT(END_TIME, '%h:%i %p') AS END_TIME FROM COURSE_SCHEDULE CS, COURSE C WHERE CS.COURSE_ID = C.COURSE_ID AND  CS.COURSE_ID IN (SELECT COURSE_ID FROM FACULTY_COURSE WHERE FACULTY_ID ='"+user_id+"') AND DATE_FORMAT(CS.BEGIN_TIME, '%m/%d/%Y') ='"+date+"' AND CS.STATUS ='A' ORDER BY CS.BEGIN_TIME";
  }
  console.log('Query' + query);
  connection.query(query, function(err, rows, fields)   
    { 
          if (err){
                console.log(err);
                }
          else{
            console.log(rows);
            callback(rows);
          }
    });
}


function getSceduleForSpecifiedCourse(user_id, course, type, callback){
var query;
  if(type=='Student'){
    query="SELECT C.COURSE_NAME , DATE_FORMAT(CS.BEGIN_TIME, '%d-%b-%Y') DATE, DATE_FORMAT(BEGIN_TIME, '%h:%i %p') AS START_TIME , DATE_FORMAT(END_TIME, '%h:%i %p') AS END_TIME FROM COURSE_SCHEDULE CS, COURSE C WHERE CS.COURSE_ID = C.COURSE_ID AND  CS.COURSE_ID IN (SELECT COURSE_ID FROM STUDENT_COURSE WHERE STUDENT_ID ='"+user_id+"') AND CS.BEGIN_TIME >= NOW()  AND UPPER(C.COURSE_NAME) LIKE UPPER('%"+course+"%') AND CS.STATUS ='A' ORDER BY CS.BEGIN_TIME";
  }
  else if(type=='Faculty'){    
    query="SELECT C.COURSE_NAME , DATE_FORMAT(CS.BEGIN_TIME, '%d-%b-%Y') DATE, DATE_FORMAT(BEGIN_TIME, '%h:%i %p') AS START_TIME , DATE_FORMAT(END_TIME, '%h:%i %p') AS END_TIME FROM COURSE_SCHEDULE CS, COURSE C WHERE CS.COURSE_ID = C.COURSE_ID AND  CS.COURSE_ID IN (SELECT COURSE_ID FROM FACULTY_COURSE WHERE FACULTY_ID ='"+user_id+"') AND CS.BEGIN_TIME >= NOW()  AND UPPER(C.COURSE_NAME) LIKE UPPER('%"+course+"%') AND CS.STATUS ='A' ORDER BY CS.BEGIN_TIME";
  }
  console.log('Query' + query);
  connection.query(query, function(err, rows, fields)   
    { 
          if (err){
                console.log(err);
                }
          else{
            console.log(rows);
            callback(rows);
          }
    });
}

//API STARTS
var express = require('express');
var fs = require("fs");

var restResponse = require('express-rest-response');

var options = {
  showStatusCode: true,  
  showDefaultMessage: true  
};
 


var router = express.Router();
var app =express();
const port=1337;
//app.listen(process.env.ROOT||1337);
app.listen(port, ()=>{
console.log('We are live on ' + port);

});

app.use(restResponse(options));

app.get('/', function(req,res){
res.send('Hello Express!');

});

//Example
app.get('/listUsers', function (req, res) {
   fs.readFile( __dirname + "/" + "user.json", 'utf8', function (err, data) {
       console.log( data );
       res.end( data );
   });
});

app.get('/getUserDetail/:id', function (req, res, rest) {
    getUserDetail(req.params.id, function(rows){
        res.end(JSON.stringify(rows));
    });   
});


//API ENDS
// Setup Restify Server
var server = restify.createServer();

server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});


// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: "c7934557-02cf-4517-a6ca-11c6ee377498", //process.env.MICROSOFT_APP_ID,
    appPassword: "mTBime6SLoU3YcgWaMu8BGW" //process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());



var userStore = [];
// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot1 = new builder.UniversalBot(connector, [function (session){	
	//session.send("You said: %s", session.message.text);
  builder.Prompts.text(session, 'Welcome!!');
	var address = session.message.address;
	userStore.push(address);  
	session.endDialog('You\'ve been invited to a access schedules! It will start in a few seconds...');
  session.userData.userName = "Susan";
  session.userData.userAge = 37;
  session.userData.hasChildren = true;

}]);


// Every 5 seconds, check for new registered users and start a new dialog
setInterval(function () {
    var newAddresses = userStore.splice(0);
    newAddresses.forEach(function (address) {

        console.log('Starting access schedules for address:', address);

        // new conversation address, copy without conversationId
        var newConversationAddress = Object.assign({}, address);
        delete newConversationAddress.conversation;

        // start access schedules dialog
        bot1.beginDialog(newConversationAddress, 'access_schedules', null, function (err) {
            if (err) {
                // error ocurred while starting new conversation. Channel not supported?
                bot1.send(new builder.Message()
                    .text('This channel does not support this operation: ' + err.message)
                    .address(address));
            }
        });

    });
}, 5000);

var dateComponent= function (dateInfo){
var d= new Date(dateInfo);
var monthComponent=d.getMonth()+1;
monthComponent= monthComponent<9?'0'+monthComponent:monthComponent;
var dayComponent=d.getDate();
dayComponent= dayComponent<9?'0'+dayComponent:dayComponent;
var processedDate=monthComponent +'/'+dayComponent+'/'+d.getFullYear();
return processedDate;

};

var scheduleCardForDay=function(results, type, showDate){
    console.log('results.length' + results.length);
    var ret='';
    for (var i = 0; i < results.length; i++) {       
      if(type=='Student'){
        ret += '<br>'+ (i+1) + '> <br>' +  (showDate===true?results[i].DATE + '<br>':'') + results[i].COURSE_NAME +' <br>   '+ results[i].START_TIME + ' - '+ results[i].END_TIME + ' <br>    Faculty: ' + (results[i].FACULTY?results[i].FACULTY:'?') ;
      }
      else if(type=='Faculty'){
       ret += '<br>' + (i+1) + '> <br>' +  (showDate===true?results[i].DATE + '<br>':'' )+  results[i].COURSE_NAME +' <br>   '+ results[i].START_TIME + ' - '+ results[i].END_TIME ;      
      }     
    }
    return ret;
};

bot1.dialog('access_schedules', [    
    function (session) {
      var greetingMsg='';
        var d = new Date();
      if(d.getHours()>= 17){
          greetingMsg="Good Evening!"
      }
      if(d.getHours()>= 12 && d.getHours()  <= 16 ){
          greetingMsg="Good Afternoon!"
      }else{
        greetingMsg = "Good Morning!";
      }
        greetingMsg += "<br> I am "+ session.userData.userName;
        builder.Prompts.text(session, greetingMsg + '<br> Please type in your ID.');

    },
    function (session, results, next) {        
        session.userData.id = results.response;
        session.userData.type = results.response;
        getUserDetail(results.response, function(result,  type){
            if(result){
                session.userData.type = type;
                session.userData.name=result;
                session.send("Hello "+ result);
                next();               
              }else{               
               session.send("Your ID is not enrolled. Try with your correct ID");
                //session.endDialog();              
              }

        });        
    },
    function (session, results) {
        session.userData.coding = results.response; 
        getUpcomingSceduleForDay(session.userData.id, session.userData.type, function(results){
            if(results.length > 0){  
                  session.send("Your upcoming schedules for day.");
                  session.send(scheduleCardForDay(results,session.userData.type, false));                            
              }else{               
               session.send("You have no schedules for the day.");             
              }
              session.send("You can find the scedules based on following criteria.");
              builder.Prompts.choice(session, "Please select Schedules by..", ["Next number of Days","Date","Course name", "No Thanks!"], { listStyle: builder.ListStyle.button });
        });               
    },
    function (session, results) {
        session.userData.choice = results.response.entity;
        if(session.userData.choice=='Next number of Days'){           
             session.beginDialog('askForSchedulesBasedOnNumberOfDays');
        }
        else if(session.userData.choice=='Date'){
          session.beginDialog('askForSchedulesBasedOnDate');
        }
        else if(session.userData.choice=='Course name'){
          session.beginDialog('askForSchedulesBasedOnCourse');          
        }
        else{
          if(session.userData.type == 'Student'){
            session.endDialog('Thank you ' + session.userData.name + ' for visiting us.');
          }
          else if(session.userData.type == 'Faculty'){
          session.beginDialog('askCancelMeeting'); 
            }
        }       
    }

    

]);

bot1.dialog('askCancelMeeting', [
  function (session) {
         session.send('If you would like to cancel any meeting, please select any of option');
         builder.Prompts.choice(session, "Cancel ", ["for next number of Days","on a date","for a course", "No Thanks!"], { listStyle: builder.ListStyle.button });
    },
  function (session, results) {
        session.userData.choice = results.response.entity;
        if(session.userData.choice=='for next number of Days'){           
             session.beginDialog('cancelScheduleForNumberOfDays');
        }
        else if(session.userData.choice=='on a date'){
          session.beginDialog('cancelScheduleForADate');
        }
        else if(session.userData.choice=='for a course'){
          session.beginDialog('cancelScheduleForCourse');          
        }
        else{        
            session.endDialog('Thank you ' + session.userData.name + ' for visiting us.');
          }        
    }
  ]);

//Start Cancel schedules
bot1.dialog('cancelScheduleForNumberOfDays', [
    function (session) {
         builder.Prompts.number(session, "Please input number of days (including today)?");
    },
    function (session, results) {
        session.userData.numberOfDays = results.response;           
         cancelScheduleForNumberOfDays(session.userData.id, session.userData.numberOfDays);                      
         session.endDialog('Requested schedules have been canceled. <br>Thank you ' + session.userData.name + ' for visiting us.');          
    }]);

bot1.dialog('cancelScheduleForADate', [
    function (session) {
         builder.Prompts.number(session, "Please type in Date in (MM/DD/YYYY) format");
    },
    function (session, results) {
        session.userData.inputDate = builder.EntityRecognizer.resolveTime([results.response]); 
        var processedDate =dateComponent(session.userData.inputDate);         
         cancelScheduleForADate(session.userData.id, processedDate);
         session.endDialog('Requested schedules have been canceled. <br>Thank you ' + session.userData.name + ' for visiting us.');        
        
    }]);

bot1.dialog('cancelScheduleForCourse', [
    function (session) {

          builder.Prompts.text(session, "Please type in course!");
    },
    function (session, results) {        
        session.userData.courseName = results.response;         
         cancelScheduleForCourse(session.userData.id, session.userData.courseName);
         session.endDialog('Requested schedules have been canceled. <br>Thank you ' + session.userData.name + ' for visiting us.');        
    }]);

//End Cancel schedules
bot1.dialog('askForSchedulesBasedOnNumberOfDays', [
    function (session) {
         builder.Prompts.number(session, "Please input next number of days, you need schedules for");
    },
    function (session, results) {
        session.userData.numberOfDays = results.response;           
         getSceduleForNumberOfDays(session.userData.id, session.userData.numberOfDays, session.userData.type, function(results){
            if(results.length > 0){  
                  session.send("Your requested schedules...");
                  session.send(scheduleCardForDay(results,session.userData.type, true));                          
              }else{               
               session.send("You have no schedules for the your request.");                        
              }             
              if(session.userData.type == 'Faculty'){
                session.beginDialog('askCancelMeeting'); 
              }
              else if(session.userData.type == 'Student'){
               session.endDialog('Thank you ' + session.userData.name + ' for visiting us.');
              }
        });
        
    }]);

bot1.dialog('askForSchedulesBasedOnDate', [
    function (session) {
         builder.Prompts.time(session, "Please type in Date in (MM/DD/YYYY) format");
    },
    function (session, results) {
        session.userData.inputDate = builder.EntityRecognizer.resolveTime([results.response]); 
        var processedDate =dateComponent(session.userData.inputDate);
         getSceduleForSpecifiedDate(session.userData.id, processedDate, session.userData.type, function(results){
            if(results.length > 0){  
                  session.send("Your requested schedules...");
                  session.send(scheduleCardForDay(results,session.userData.type, true));                 
              }else{               
               session.send("You have no schedules for the your request.");                        
              }
              if(session.userData.type == 'Faculty'){
                session.beginDialog('askCancelMeeting'); 
              }
              else if(session.userData.type == 'Student'){
               session.endDialog('Thank you ' + session.userData.name + ' for visiting us.');
              }
        });        
    }]);

bot1.dialog('askForSchedulesBasedOnCourse', [
    function (session) {
         builder.Prompts.text(session, "Please type in course");
    },
    function (session, results) {
        session.userData.courseName = results.response;           
         getSceduleForSpecifiedCourse(session.userData.id, session.userData.courseName, session.userData.type, function(results){
            if(results.length > 0){  
                  session.send("Your requested schedules...");
                  session.send(scheduleCardForDay(results,session.userData.type, true));              
              }else{               
               session.send("You have no schedules for the your request.");                        
              }
              if(session.userData.type == 'Faculty'){
                session.beginDialog('askCancelMeeting'); 
              }
              else if(session.userData.type == 'Student'){
               session.endDialog('Thank you ' + session.userData.name + ' for visiting us.');
              }
        });
    }]);