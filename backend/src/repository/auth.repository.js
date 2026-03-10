import User from '../models/users.model.js';



class AuthRepository {
    async findByEmail(email){
        return User.findOne({email: email, isDeleted: false});
    }
    async login(email, password) {
        // Find user by email only - password verification happens in service layer
        const user = await User.findOne({ email: email, isDeleted: false });
        console.log('AuthRepository.login:', { email, user });
        
        // Auto-migrate users without status field to PENDING
        if (user && !user.status) {
            user.status = 'PENDING';
            await user.save();
        }
        
        return user; // Return user or null, let service handle password verification
    }

    async register(userData){
        const existed = await this.findByEmail(userData.email);
        if(existed){
            throw new Error('Email is already existed');

        }
        const newUser = new User(userData);
        await newUser.save();
        return newUser;
    }
}

export default AuthRepository;