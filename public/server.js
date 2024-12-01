// server.js
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const projectSchema = new mongoose.Schema({
    name: String,
    description: String,
    missions: Array,
    progress: Number
});

const Project = mongoose.model('Project', projectSchema);

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.json());

// Allow cross-origin requests (if needed)
const cors = require('cors');
app.use(cors());

// Get Projects
app.get('/api/projects', async (req, res) => {
    const projects = await Project.find();
    res.json({ projects });
});

// Save Projects
app.post('/api/projects', async (req, res) => {
    await Project.deleteMany({});
    await Project.insertMany(req.body.projects);
    res.json({ status: 'success' });

    // Notify clients via WebSocket
    io.emit('projectsUpdated', req.body.projects);
});

// Start the server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
