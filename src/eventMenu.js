
import { useUser } from './usercontext';

import './styles.css';
export default function EventMenu(){

    const { state, dispatch } = useUser();
   

    const colorPalette = [
        '#B0E0E6', // Pale blue
        '#D5E8D4', // Light green
        '#F8E6D2', // Soft peach
        '#D3D3E7', // Lavender
        '#FAE3E3', // Light blush
        '#F2D7EE', // Pale pink
        '#C2D9E7', // Light sky blue
        '#F8EDD3', // Cream
        '#D4E2D4', // Mint
        '#E7D3C2'  // Beige
    ];
    const commitmentStyle = {
        position: 'relative',
        marginBottom: '15px',
        padding: '15px',
        backgroundColor: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: '6px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
      };
      
      const removeButtonStyle = {
        zIndex: 10,
        position: 'absolute',
        top: '5px',
        right: '5px',
        background: 'transparent',
        border: 'none',
        fontSize: '18px',
        cursor: 'pointer',
        color: 'red',
      };
         
    
      

    const formatTime = (time) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours, 10);
        const period = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 || 12; // Converts "0" to "12" for midnight
    
        return `${formattedHour}:${minutes} ${period}`;
    };
    
    const handleRemoveCommitment = async (commitmentId) =>{

        try {
            const response = await fetch(`http://localhost:5000/api/users/${state.id}/${commitmentId}/remove-commitment`, {
                method: 'DELETE'
            });
            if (response.ok) {
                
            
                dispatch({ type: 'REMOVE_COMMITMENT', payload: commitmentId });
          
              } else {
                console.error("Failed to delete commitment");
              }
            } catch (error) {
              console.error("Error deleting commitment:", error);
            }
         

    };

    
    const renderCommitments = () => {
        
        if (state.commitments && state.commitments.length > 0) {
            return (
                <div>
                    {state.commitments.map((commitment, index) => {
                        // Parse days if it is a JSON string or comma-separated string
                        const parsedDays = Array.isArray(commitment.days)
                            ? commitment.days
                            : JSON.parse(commitment.days) || commitment.days.split(',');
        
                        // Parse dates if it's a JSON string
                        const parsedDates = Array.isArray(commitment.dates)
                            ? commitment.dates
                            : JSON.parse(commitment.dates);
                        const lastDigit = commitment.id % 10;
                        const color = colorPalette[lastDigit];
                        return (
                            <div key={index} style={{...commitmentStyle,backgroundColor:color}}>
                                <button style={removeButtonStyle}
                                    onClick={() => handleRemoveCommitment(commitment.id)}
                                   
                                >
                                    &times;
                                </button>
                                <h3>{commitment.name || 'N/A'}</h3>
                                <p>{formatTime(commitment.startTime)} - {formatTime(commitment.endTime)}</p>
                                <p>{(parsedDays.length > 0 && parsedDays.length < 7)? `${parsedDays.join(', ')}` : ''}</p>
                                <p>
                                    {parsedDates.length > 0 
                                        ? `${new Date(parsedDates[0]).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}` 
                                        : ''}
                                    {parsedDates.length > 1 
                                        ? ` - ${new Date(parsedDates[1]).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}` 
                                        : ''}
                                </p>
                            </div>
                        );
                    })}
                </div>
            );
        }
        
    };

  

    return(


        <div>

            {state.commitments.length > 0 && (renderCommitments())}

        </div>


    )


}