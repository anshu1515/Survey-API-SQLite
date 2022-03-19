require('dotenv').config()
const express = require('express')
const app = express()
const router = express.Router()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const middleware = require('../middleware/auth')

const { createUsersTable, createSurveyTable, createUser, createSurvey, findUserByEmail,  findSurvey, getQuestions, updateYesQuestion, updateNoQuestion } = require('../utils/utils')

//----------->Creating Tables<---------------
createUsersTable()
createSurveyTable()

router.use(express.urlencoded({ extended: false }))
router.use(express.json())

//-------------->Getting Started<-----------------------
router.get('/',(req, res) => {
    res.json({
        message: "Welcome to Survey API"
    })   
})

//----------->Registration Router<--------------------------
router.post('/register', async (req, res) => {
    const { name, email } = req.body
    const password = bcrypt.hashSync(req.body.password)

    createUser([name, email, password], err => {
        if(err) {
            console.log("Your error is: ",err)
            return res.send({
                error: false, 
                message: err
            })
        } findUserByEmail(email, (err, user) => {
            if(err) {
                return res.status(500).send('Server error!')
            }
            const expiresIn = 24 * 60 * 60
            const access_token = jwt.sign({ id: user.id }, process.env.SECRET_KEY, {
                expiresIn
            })
            res.status(200).send({
                user,
                access_token,
                expiresIn
            })
        })
    })
})

//---------------->Login to Give or Create Survey<-----------------
router.post('/login', async (req, res) => {
    const { email, password } = req.body
    findUserByEmail(email, (err, user) => {
        if(err) {
            return res.status(500).send('Server error', err.message)
        }
        if(!user) {
            return res.status(404).send('User not found')
        }
        const result = bcrypt.compareSync(password, user.password)
        if(!result) {
            return res.status(401).send('Password not valid!')
        }

        const expiresIn = 24 * 60 * 60
        const accessToken = jwt.sign({ id: user.id }, process.env.SECRET_KEY, {
            expiresIn
        }) 
        console.log(user)
        res.status(200).send({
            user,
            accessToken,
            expiresIn
        })
    })
})

//-------------->Create a Survey<-------------------------
router.post('/createSurvey', middleware.verifyToken, (req, res) => {
    const { survey_name, questions, email } = req.body 
    let created_by_user = email
    questions.forEach((el) => {
        createSurvey([survey_name, el,created_by_user], (err) => {
            if(err) {
                console.log('Error while creating the survey', err)
                res.status(400).send({
                    error: false,
                    message: err.message
                })
            }

            console.log(`Survey created successfully, survey name ${survey_name}`)
        })
    })

    res.status(200).send({
        error: true,
        message: `Survey of name ${survey_name} is created`
    })
})

//------------------->Find Survey By Survey Name<----------------------------
router.get('/findSurvey/:surveyName',async (req, res) => {
    const name = req.params.surveyName
        findSurvey(name, (err, rows) => {
            if(err) {
                console.log("Error while fetching the surveys", err)
                res.status(400).send({
                    error: false,
                    message: err.message
                })
            }
            if(rows.length === 0) {
                res.status(404).send({
                    message: `No such survey found named ${name}`
                })
                return
            }
            let questions = rows.map((el) => el.questions)
            res.status(200).send(questions.join(', \n'))
        })
})

//-------------------->Taking a Survey<----------------
router.post('/takeSurvey/:surveyName', async (req, res) => {
    try {
        let responseBody = req.body.response 
        let survey_name = req.params.surveyName
        let questions = await getQuestions(survey_name)
        if(questions.length == 0) {
            res.status(404).send({
                message: `Sorry no survey found as name ${survey_name}`
            })
            return
        }
        if(!responseBody) {
            console.log(questions)
            res.send(questions.join('\n'))
        } else {
            if(questions.length != responseBody.length) {
                res.status(404).send({
                    error: false,
                    message: "Please answer all the questions || Incomplete response"
                })
            } else {
                for(let i=0;i<questions.length;i++) {
                    if(responseBody[i] === 'yes') {
                        updateYesQuestion(questions[i], (err, row) => {
                            if(err) {
                                console.log("Error while updating the 'yes' responses")
                            }
                            console.log("Responses are saved", row)
                        })
                    } else {
                        updateNoQuestion(questions[i], (err, row) => {
                            if(err) {
                                console.log("Error while updating the 'no' response", err)
                            }
                            console.log("responses are saved successfully", row)
                        })
                    }
                }
                res.status(200).send({
                    message: "Your response is saved successfully"
                })
            }

        }
    } catch (e) {
        res.status(400).send(e.message)
    }
})

//------------------->Getting the results of Survey<----------------
router.get('/getResults/:surveyName', middleware.verifyToken, async (req, res) => {
    let name = req.params.surveyName
    findSurvey(name, (err, row) => {
        if(err) {
            console.log('error while getting the survey result', err)
            res.status(400).send({
                error: false,
                message: err.message
            })
        }
        if(row.length === 0) {
            res.status(404).send({
                message: `No survey found as named ${name}`
            })
        }
        console.log("Survey result found", row)
        let arr = row.map(el => {
            let total = el.yes + el.no
            let no = el.no/total * 100
            let yes = el.yes/total * 100
            return {
                question: el.questions,
                yes: yes + '%',
                no: no + '%'
            }
        })
        res.status(200).send(arr)
    })
})


module.exports = router;