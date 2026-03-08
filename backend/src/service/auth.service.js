import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/users.model.js';
import AuthRepository from '../repository/auth.repository.js';

const authRepo = new AuthRepository();


// tạo token cho account user
export const generateToken = (user) => {
    const accessToken = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );
    return { accessToken, refreshToken };
};

//basic login service
export const login = async(email, password) => {
    const user = await authRepo.login(email, password);
    if(!user){
        throw new Error('User not found');
    }
    const isMatch = await user.comparePassword(password);
    if(!isMatch){
        throw new Error('Invalid password');
    }

    // RBAC: block login for non-ACTIVE accounts
    if (user.status === 'PENDING') {
        throw new Error('Your account is pending admin approval');
    }
    if (user.status === 'REJECTED') {
        throw new Error('Your account registration has been rejected');
    }

    const tokens = generateToken(user);
    
    // Cập nhật refresh token vào database
    user.refreshToken = tokens.refreshToken;
    await user.save();
    
    // Loại bỏ password trước khi trả về
    const { password: _, refreshToken: __, ...userWithoutSensitiveData } = user.toObject();
    
    return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: userWithoutSensitiveData
    };
};
// register service — new accounts are PENDING until admin approves
export const register = async({name,email, password, role, status}) =>{
    if(!name || !email || !password){
        throw new Error("Missing required field!")
    }

    // Hash password
    const hashed = await bcrypt.hash(password,12);
    password = hashed;

    const user = await authRepo.register({
        name, 
        email,
        password,
        role: role || "member",
        // Default PENDING for self-registration; callers (e.g. admin) can pass ACTIVE
        status: status || "PENDING"
    });

    //  Loại bỏ password và refreshToken trước khi trả về client
    const {password: _, refreshToken: __, ...userWithoutPassword} = user.toObject();
   
    return {
        user: userWithoutPassword
    };
};

// Refresh token service
export const refreshTokenService = async (refreshToken) => {
    try {
        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        
        // Tìm user và kiểm tra refresh token có khớp không
        const user = await User.findOne({ 
            _id: decoded.id, 
            refreshToken: refreshToken,
            isDeleted: false 
        });
        
        if (!user) {
            throw new Error('Invalid refresh token');
        }
        
        // Generate tokens mới
        const tokens = generateToken(user);
        
        // Cập nhật refresh token mới vào database
        user.refreshToken = tokens.refreshToken;
        await user.save();
        
        // Loại bỏ password và refreshToken trước khi trả về
        const { password: _, refreshToken: __, ...userWithoutSensitiveData } = user.toObject();
        
        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: userWithoutSensitiveData
        };
    } catch (error) {
        throw new Error('Invalid or expired refresh token');
    }
};