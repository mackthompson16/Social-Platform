


class User {
    constructor({ username = 'defaultUsername', password = 'defaultPassword', email = 'default@example.com', id = 'id' } = {}) {
        this.username = username;
        this.password = password;
        this.email = email;
        this.id = id;
    }
    async getUserCommitments() {
      
        try {
         
          const response = await fetch(`http://localhost:5000/api/users/${this.id}/getCommitments`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
    
          if (!response.ok) {
            throw new Error('Failed to fetch commitments');
          }
          
          const data = await response.json();
          const commitments = data.commitments || [];
          return commitments; 
        } catch (error) {
          console.error('Error fetching commitments:', error);
          return []; 
        }
      }

      async removeCommitment(commitmentId) {
        try {
            const response = await fetch(`http://localhost:5000/api/removeCommitment/${this.id}/${commitmentId}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                
                console.error("Failed to delete commitment");
            }
        } catch (error) {
            console.error("Error deleting commitment:", error);
        }
    };
    

    async addCommitment(newCommitment) {
       
        
        // API call to backend to update the database
        try {
            const response = await fetch(`http://localhost:5000/api/users/${this.id}/addCommitment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(newCommitment),
            });
      
            if (!response.ok) {
              throw new Error('Failed to add commitment');
            }
      
            await response.json();
      
            
          } catch (error) {
            console.error('Error adding commitment:', error);
            return null;
          }
    }


}

module.exports = User;
