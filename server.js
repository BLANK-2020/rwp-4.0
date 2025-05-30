const express = require('express')
const path = require('path')
const app = express()

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')))

// Serve the index.html file for the root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

// Start the server
const PORT = process.env.PORT || 3002
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
