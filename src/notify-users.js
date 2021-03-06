// Notify users that a new agenda has been released

require('dotenv').config()
const r = require('rethinkdb')
const twilio = require('twilio')
const Promise = require('bluebird')

const client = new twilio.RestClient(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

module.exports = function notifyUsers() {
  console.log('\nNotifying users')

  require('./connect-to-db')().then(dbConn => (

    // Find users who have enabled legisation notifications
    r.table('users')
    .filter({
      legislation_notification: true,
    })
    .run(dbConn).call('toArray')

    // Filter out demo accounts
    .filter(user => (![
      '0000001776', // DEMO LOGIN
      '5555551776', // REG DEMO
    ].includes(user.phone)))

    // Send each user a text message
    .map((user) => {
      const { first_name, last_name, phone } = user
      const name = last_name ? `${first_name} ${last_name}` : phone
      console.log(`Notifying ${name}`)

      return Promise.fromCallback(cb => client.messages.create({
        body: 'The new San Francisco legislative agenda has been released: http://liquid.vote/sf',
        from: `+1${process.env.TWILIO_NUMBER}`,
        to: `+1${phone}`,  // Text this number
      }, cb))
    })
  ))
  .then(process.exit)
}

module.exports()
