const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 9026;

app.use(express.static(path.resolve(__dirname, 'public')));
app.use(bodyParser.json());

app.all('/api/draw', (req, res) => {
    console.log(req.body);
    res.json({result: 'ok'});
});

app.listen(PORT, () => {
    console.log(`server running at http://localhost:${PORT}/`);
});
