const request = require('supertest')
const chai = require('chai')
const app = require('../index') // Your Express app
const chaiHttp = require('chai-http')
const expect = chai.expect
chai.use(chaiHttp)

/*
describe('Events API', () => {
    // Test for getAllEvents route
    describe('GET /events', () => {
        it('should return a list of events with default offset and limit', (done) => {
            request(app)
                .get('/events')
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err)
                    // Add assertions for the response body here
                    expect(res.body).to.be.an('array')
                    done()
                })
        })

        // Add more test cases for different scenarios (pagination, filters, etc.) if needed
    })

    // Test for createEvent route
    describe('POST /events', () => {
        it('should create a new event', (done) => {
            const newEvent = {
                title: 'Test Event',
                description: 'This is a test event',
                duration: '180',
                hour: '15:00',
                tags: ['test', 'mocha', 'chai'],
                link: 'https://example.com/test-event',
                creator: '645722094afac96e1c0bd5eb',
            }

            request(app)
                .post('/events')
                .send(newEvent)
                .expect(201)
                .end((err, res) => {
                    if (err) return done(err)
                    // Add assertions for the response body here
                    expect(res.body).to.have.property('_id')
                    expect(res.body.title).to.equal(newEvent.title)
                    // ...
                    done()
                })
        })

        // Add more test cases for different scenarios (missing data, validation errors, etc.) if needed
    })

    // Test for getEventById route
    describe('GET /events/:id', () => {
        it('should return a specific event by ID', (done) => {
            const eventId = '64f1fbe49c67c5bf61c27078'

            request(app)
                .get(`/events/${eventId}`)
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err)
                    // Add assertions for the response body here
                    expect(res.body).to.have.property('_id', eventId)
                    // ...
                    done()
                })
        })

        // Add more test cases for different scenarios (invalid ID, non-existent ID, etc.) if needed
    })

    // test for login

    describe('POST /login', () => {
        it('should return a token', (done) => {
            const credentials = {
                username: 'lain',
                password: 'aA12345!',
            }

            request(app)
                .post('/auth/login')
                .send(credentials)
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err)
                    // Add assertions for the response body here
                    expect(res.body).to.have.property('auth_token')
                    // ...
                    done()
                })
        })

        // Add more test cases for different scenarios (invalid credentials, etc.) if needed
    })
})
*/

describe('Functional Test - Join Event Route', () => {
    it('Should block registration if the participant is already participating', (done) => {
        const user = '64f2414280b08ebbd6f1fe91'
        request(app)
            .post(`/events/joinEvent/64f23db8881dc5c609625a34`)
            .send({ userId: user })
            .expect(400)
            .end((err, res) => {
                if (err) return done(err)
                // Add assertions for the response body here
                expect(res.body.message).to.equal(
                    'User is already a participant in this event'
                )
                done()
            })
    })
})

describe('Functional Test - Join Event Route', () => {
    it('Should block registration if event is full', (done) => {
        const user = 'token'
        request(app)
            .post(`/events/joinEvent/64f23db8881dc5c609625a34`)
            .send({ userId: user })
            .expect(400)
            .end((err, res) => {
                if (err) return done(err)
                // Add assertions for the response body here
                expect(res.body.message).to.equal(
                    'Event has reached the participant limit'
                )
                done()
            })
    })
})

describe('Integration Test - Get Events (Authenticated)', () => {
    let authToken // Declare a variable to store the authentication token

    before((done) => {
        // Define the login credentials
        const credentials = {
            username: 'lain',
            password: 'aA12345!',
        }

        // Make a POST request to the /auth/login endpoint to obtain the token
        chai.request(app)
            .post('/auth/login')
            .send(credentials)
            .end((err, res) => {
                if (err) return done(err)

                // Extract the authentication token from the response
                authToken = res.body.auth_token

                done()
            })
    })

    it('should return a list of events when authenticated', (done) => {
        // Make a GET request to /events with the obtained authorization token
        chai.request(app)
            .get('/events')
            .set('Authorization', `Bearer ${authToken}`)
            .end((err, res) => {
                if (err) return done(err)

                // Add assertions for the response here
                expect(res).to.have.status(200)
                expect(res.body).to.be.an('array') // Assuming the response is an array of events

                done()
            })
    })
})
