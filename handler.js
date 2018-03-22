'use strict';

var tracery = require('tracery-grammar');
var Twit = require('twit');
const team = process.env.TEAM;

var T =  new Twit({
  consumer_key:         process.env.API_KEY,
  consumer_secret:      process.env.API_SECRET,
  access_token:         process.env.ACCESS_TOKEN,
  access_token_secret:  process.env.ACCESS_SECRET
});

module.exports.match = (event, context, callback) => {
  let response = {
    statusCode: 200,
    body: {},
  };

  switch (event.message_type) {
    case "verification":
      console.log(event.verification_key);
      break;
    case "match_score":
      console.log(event.message_data.match);
      let message = generateResponse(event.message_data.match);
      response.body = {message};
      T.post('statuses/update', {status: message});
      break;
    default:
      console.log(event.message_data);
  }
  callback(null, response);

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
};


function generateResponse(data) {

  let alliance = data.alliances.blue.teams.includes(team)? 'blue' : 'red';
  let outcome = 'tie';
  if(data.alliances.blue.score > data.alliances.red.score) {
    outcome = alliance === 'blue' ? 'won' : 'lost';
  }
  if(data.alliances.blue.score < data.alliances.red.score) {
    outcome = alliance === 'blue' ? 'lost' : 'won';
  }

  let partners = data.alliances[alliance].teams.filter((t) => (t !== team));


  const levels = {qm: 'Qualifying', qf: "Quarterfinal", sf: "Semifinal", f:'Final'};
  const opposite = {red: 'blue', blue:'red'};

  var grammar = tracery.createGrammar({
    'team': [team],
    'color': [alliance],
    'score': [`${data.alliances[alliance].score} to ${data.alliances[opposite[alliance]].score}`],
    'match': [`${levels[data.comp_level]} Match ${data.set_number}`],
    'partners': [`${partners.join(' and ')}`],
    'won': [`We won #match# #score# thanks to our #partners#`],
    'lost': [`We lost #match# #score# with our #partners#`]
  });

  grammar.addModifiers(tracery.baseEngModifiers);

  return grammar.flatten(`#${outcome}#`);
}
