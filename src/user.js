
class scheduleClass
{
    constructor(scheduleName, commitments)
    {
        this.name = scheduleName;
        this.commitments = commitments;
    }
    //eventually going to implement a editSchedule and deleteSchedule
}

class User {
    constructor({ username = 'defaultUsername', password = 'defaultPassword', email = 'default@example.com', schedules = [], id = 'id' } = {}) {
        this.username = username;
        this.password = password;
        this.email = email;
        this.schedules = schedules;
        this.id = id;
    }
    
    async createSchedule(scheduleName, commitments) {
        const newSchedule = new scheduleClass(scheduleName, commitments);

        // API call to backend to update the database
        try {
            const response = await fetch(`http://localhost:5000/api/users/${this.id}/schedules`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newSchedule)
            });

            if (!response.ok) {
                throw new Error('Failed to create schedule');
            }

            const updatedUser = await response.json();
            this.schedules = updatedUser.schedules; // Assuming the backend returns the updated user object
            console.log('Schedule created and saved to database');
        } catch (error) {
            console.error('Error creating schedule:', error);
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
