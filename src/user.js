


class User {
    constructor({ username = 'defaultUsername', password = 'defaultPassword', email = 'default@example.com', commitments = [], id = 'id' } = {}) {
        this.username = username;
        this.password = password;
        this.email = email;
        this.commitments = commitments;
        this.id = id;
    }
    
    async addCommitment(commitment) {
       
        
        // API call to backend to update the database
        try {
            const response = await fetch(`http://localhost:5000/api/users/${this.id}/commitments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(commitment)
            });
    
            if (!response.ok) {
                throw new Error('Failed to add commitment');
            }
    
            const data = await response.json();
           
    
            this.commitments = data.commitments; // Update the user's commitments from the returned data
    
            
            return data.user; // Return the updated user data
        } catch (error) {
            console.error('Error creating commitment:', error);
            return null; // Return null or an appropriate fallback if an error occurs
        }
    }
    



    static async getAllUsers() {
        try {
            const response = await fetch('http://localhost:5000/api/users');
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.status}`);
            }
            const data = await response.json();
            return data.users; // Assuming data.users contains the array of users
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error; // Rethrowing the error or handling it accordingly
        }
    }

    static async getUserById(userId) {
        try {
            const users = await this.getAllUsers(); // Since getAllUsers is already async
            console.log("searching for user:", userId);
            const user = users.find(user => user.id === userId);
            if (user) {
                console.log("Fetched User: ", user.username);
                return user;
            } else {
                throw new Error('User not found');
            }
        } catch (err) {
            console.error("Error fetching user:", err);
            throw err; // Rethrow or handle as needed
        }
    }



}

module.exports = User;
