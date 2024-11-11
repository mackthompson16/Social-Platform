 
    export async function getUserCommitments(id) {
      
        try {
         
          const response = await fetch(`http://localhost:5000/api/users/${id}/getCommitments`, {
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

      export async function removeCommitment(id,commitmentId) {
        try {
            const response = await fetch(`http://localhost:5000/api/removeCommitment/${id}/${commitmentId}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                
                console.error("Failed to delete commitment");
            }
        } catch (error) {
            console.error("Error deleting commitment:", error);
        }
    };
    

    export async function addCommitment(id,newCommitment) {
       
        
        // API call to backend to update the database
        try {
            const response = await fetch(`http://localhost:5000/api/users/${id}/addCommitment`, {
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


