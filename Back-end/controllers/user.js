const User = require('../models/user');
const { createJWT } = require('../middlewares/auth');
const { isEmail } = require('validator');

const signupUser = async (req, res) => {
    try {
        if (
            !req.body.firstName ||
            !req.body.lastName ||
            !isEmail(req.body.email) ||
            req.body.password.length < 7
        )
            return res.status(400).json({ message: 'Invalid credentials' });
        const user = await User.findOne({ email: req.body.email });
        if (user) return res.status(400).json({ message: 'Email already taken' });
        const newUser = new User(req.body);
        await newUser.save();
        const token = await createJWT(newUser);
        res.status(201).json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
};

const deleteUser = async (req, res) => {
    try {
        const user = await User.findOneAndDelete({ _id: req.user._id });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
};

const updateUser = async (req, res) => {
    try {
        //! the findIdAndUpdate method bypasses mongoose
        //! It performs a direct operation on the database
        //+ this means that our middleware won't be executed
        const user = await User.findOne({ _id: req.user._id });
        if (!user) return res.status(404).json({ message: 'User not found' });
        user.comparePassword(req.body.password, async (err, isMatch) => {
            if (isMatch) {
                user.firstName = req.body.firstName;
                user.lastName = req.body.lastName;
                if (req.body.newPassword !== '') user.password = req.body.newPassword;
                await user.save();
                const token = createJWT(user);
                return res.json({ token });
            }
            res.status(400).json({ message: 'Wrong password!' });
        });
    } catch (error) {
        res.status(500).send({ message: 'Something went wrong', error });
    }
};

const loginUser = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(404).json({ message: "User doesn't exist" });
        user.comparePassword(req.body.password, async (error, isMatch) => {
            if (!isMatch || error)
                return res.status(400).json({ message: 'Unable to login, bad credentials' });
            const token = await createJWT(user);
            res.json({ token });
        });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
};

const userProfile = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.user._id });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
};

module.exports = {
    signupUser,
    deleteUser,
    updateUser,
    loginUser,
    userProfile
};
