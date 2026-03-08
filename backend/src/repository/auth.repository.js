import User from '../models/users.model.js';



class AuthRepository {
    async findByEmail(email){
        return User.findOne({email: email, isDeleted: false});
    }
    async findByEmailAndPassword(email, password){
        //find where status is active, if not, auto add status is pending
        const user = await User.findOne({email: email, password: password});
        if(user && !user.status){
            user.status = 'PENDING';
            await user.save();
        }
        return user;
    }
    async login(email, password) {
        const user = await this.findByEmailAndPassword(email, password);
        if (!user) {
            throw new Error('User not found');
        }
        // Không cần kiểm tra password ở đây, để service xử lý
        return user;
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