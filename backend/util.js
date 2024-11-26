import jwt from 'jsonwebtoken';
import RefreshToken from './models/RefreshToken';

function AuthenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    //debug
    console.log("TOKEN: ", token);

    if (token == null) return res.sendStatus(401); // No token

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log("JWT VERIFY ERROR: ", err);
            return res.sendStatus(403); // Invalid token
        }
        console.log("JWT VERIFY USER: ", user);
        req.user = user;
        next();
    });
}

async function CreateRefreshToken(user) {
    // Remove existing refresh tokens for this user
    await RefreshToken.deleteMany({ user: user.id });

    const refreshToken = jwt.sign(
        { id: user.id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
    );

    await RefreshToken.create({
        user: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    return refreshToken;
}

export { AuthenticateToken, CreateRefreshToken };
