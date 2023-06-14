import express from 'express'

const app = express()
const PORT = 3000

app.get('/', (req, res) => {
    res.send('Ok')
})

app.post('/send-message', (req, res) => {

    res.send('!!!')
})

app.listen(PORT, () => {
    console.log(`Successfully ${PORT}`)
})