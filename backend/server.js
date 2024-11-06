const express = require('express');
const app = express();
const cors = require('cors');


const userRoutes = require('./routes/userRoutes');
const socialRoutes = require('./routes/socialRoutes');
const authRoutes = require('./routes/authRoutes');

app.use(express.json());
app.use(cors());


app.use('/api/users', userRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
