
const db = require('../db/db')

const createUsersTable = () => {
    const sqlQuery = 'CREATE TABLE IF NOT EXISTS users( id integer PRIMARY KEY, name text, email text UNIQUE, password text)'
    return db.run(sqlQuery)
}

const createSurveyTable = () => {
    const sqlQuery = 'CREATE TABLE IF NOT EXISTS surveys( survey_id integer PRIMARY KEY, survey_name text NOT NULL, questions text NOT NULL, created_by_user text NOT NULL, yes integer DEFAULT 0, no integer DEFAULT 0)'
    db.run(sqlQuery)
}

const findUserByEmail = (email, cb) => {
    return db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, row) => {
        cb(err, row)
    })
}

const createUser = (user, cb) => {
    return db.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', user, (err) => {
        cb(err)
    })
}

const createSurvey = (surveyInfo, cb) => {
    return db.run('INSERT INTO surveys (survey_name, questions, created_by_user) VALUES (?, ?, ?)', surveyInfo, (err) => {
        cb(err)
    })
}

const findSurvey = (survey_name, cb) => {
    return db.all(`SELECT * FROM surveys WHERE survey_name = ?`, [survey_name], (err, row) => {
        cb(err, row)
    })
}

async function getQuestions (survey_name) {
    return new Promise((resolve, reject) => {
        findSurvey(survey_name, (err, row) => {
            if(err) {
                console.log("Error while fetching the questions", err)
                reject(err)
            }
            let question = row.map(el => el.questions)

            resolve(question)
        })
    })
}

const updateYesQuestion = (question, cb) => {
    db.run(`UPDATE surveys SET yes = yes + 1 WHERE questions = ?`, [question], (err, row) => {
        cb(err, row)
    })
}

const updateNoQuestion = (question, cb) => {
    db.run(`UPDATE surveys SET no = no + 1 WHERE questions = ?`, [question], (err, row) => {
        cb(err, row)
    } )
}


module.exports = {
    createUsersTable,
    createSurveyTable,
    createUser,
    createSurvey,
    findUserByEmail,
    findSurvey,
    getQuestions,
    updateYesQuestion,
    updateNoQuestion
}