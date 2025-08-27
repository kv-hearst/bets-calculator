const data = 'data.csv';
let rows = [];
let selectedTeams = [];

// Define which teams belong to which game
const gameTeams = {
    1: ['team1-moneylines', 'team2-moneylines'],
    2: ['team3-moneylines', 'team4-moneylines'],
    3: ['team5-moneylines', 'team6-moneylines']
};

// Load CSV data and display probabilities after loading
fetch(data)
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
    })
    .then(text => {
        const lines = text.split('\n').filter(line => line.trim() !== '');
        for (let line of lines) {
            const values = line.split(',').map(value => value.trim());
            rows.push(values);
        }
        console.log('CSV data loaded:', rows);
        
        // Display probabilities after data is guaranteed to be loaded
        displayTeamProbabilities();
    })
    .catch(error => {
        console.error('Error loading CSV file:', error);
        // Still try to display team names even if CSV fails
        displayTeamProbabilities();
    });

function getGameNumber(element) {
    const gameContainer = element.closest('.game-container');
    if (gameContainer) {
        return parseInt(gameContainer.id.replace('game', ''));
    }
    return null;
}

// Helper function to get game number from team ID string
function getGameNumberFromTeamId(teamId) {
    // Convert team1 to team1-moneylines for lookup
    const buttonId = teamId.includes('-moneylines') ? teamId : `${teamId}-moneylines`;
    
    for (let game in gameTeams) {
        if (gameTeams[game].includes(buttonId)) {
            return parseInt(game);
        }
    }
    return null;
}

function disableOtherTeamInGame(selectedTeamId, gameNumber) {
    const teamsInGame = gameTeams[gameNumber];
    if (teamsInGame) {
        teamsInGame.forEach(teamId => {
            if (teamId !== selectedTeamId) {
                const buttonElement = document.getElementById(teamId);
                if (buttonElement) {
                    buttonElement.disabled = true;
                    buttonElement.classList.add('disabled');
                    console.log('Disabled team:', teamId);
                }
            }
        });
    }
}

function enableAllTeamsInGame(gameNumber) {
    const teamsInGame = gameTeams[gameNumber];
    if (teamsInGame) {
        teamsInGame.forEach(teamId => {
            const buttonElement = document.getElementById(teamId);
            if (buttonElement) {
                buttonElement.disabled = false;
                buttonElement.classList.remove('disabled');
            }
        });
    }
}

function loadTeams() {
    // FIXED: Use correct button IDs
    for (let i = 1; i <= 10; i++) {
        const teamButton = document.getElementById(`team${i}-moneylines`);
        if (teamButton) {
            teamButton.addEventListener('click', function() {
                // Only respond if button is not disabled
                if (!teamButton.disabled) {
                    toggleTeamSelection(`team${i}`); // Pass base team ID
                }
            });
        }
    }
    
    const calculateButton = document.getElementById('calculate-button');
    if (calculateButton) {
        calculateButton.addEventListener('click', calculateBet);
    }

    const resetButton = document.getElementById('reset-button');
    if (resetButton) {
        resetButton.addEventListener('click', resetSelections);
    }
}

function displayTeamProbabilities() {
    for (let i = 1; i <= 10; i++) {
        const teamId = `team${i}`;
        const nameContainer = document.getElementById(`${teamId}-names`);
        const moneylineContainer = document.getElementById(`${teamId}-moneylines`);

        if (nameContainer && moneylineContainer) {
            const teamData = rows.find(row => row[0] === teamId);
            
            if (teamData) {
                nameContainer.querySelector('h3').textContent = `${teamData[1]}`;
                moneylineContainer.textContent = `${teamData[5]}`;
            }
        }
    }
}

function toggleTeamSelection(teamId) {
    console.log(`Team ${teamId} button clicked`);
    const moneylineButton = document.getElementById(`${teamId}-moneylines`);
    const gameNumber = getGameNumberFromTeamId(teamId);

    if (selectedTeams.includes(teamId)) {
        // Deselecting a team
        selectedTeams = selectedTeams.filter(team => team !== teamId);
        moneylineButton.classList.remove('selected');
        
        // Re-enable other team in this game
        if (gameNumber) {
            hideGameResultsDropdown(gameNumber);
            enableAllTeamsInGame(gameNumber);
        }
    } else {
        // Selecting a team
        if (selectedTeams.length >= 3) {
            alert('Cannot select more than 3 teams');
            return;
        }
        
        // Check if this game already has a selected team
        const gameAlreadyHasSelection = selectedTeams.some(selectedTeamId => {
            return getGameNumberFromTeamId(selectedTeamId) === gameNumber;
        });
        
        if (gameAlreadyHasSelection) {
            alert('You can only select one team per game');
            return;
        }
        
        selectedTeams.push(teamId);
        moneylineButton.classList.add('selected');
        

        const teamData = rows.find(row => row[0] === teamId);
        if (teamData) {
            const selectedTeamData = {
                teamName: teamData[1],
                profit: teamData[6],
                probability: teamData[3],
                favoredTeam: teamData[8],
                bookProbability: teamData[4] 
            };
            
            // Create and show dropdown
            createGameResultsDropdown(gameNumber, selectedTeamData);
        }

        // Disable other team in this game
        if (gameNumber) {
            disableOtherTeamInGame(`${teamId}-moneylines`, gameNumber);
        }
    }
    console.log('Currently selected teams:', selectedTeams);
}

function createGameResultsDropdown(gameNumber, selectedTeamData) {
    const gameResultsDiv = document.getElementById(`game${gameNumber}-results`);

    const favoredTeam = selectedTeamData.favoredTeam === 'TRUE' ? "the <span style='color: green;'>favored team</span>" : "<span style='color: red;'>not the favored team</span>";

    if (!gameResultsDiv) {
        console.error(`Game results div for game ${gameNumber} not found`);
        return;
    }
    const dropdownHTML = `
    <p>You selected ${selectedTeamData.teamName}! This is ${favoredTeam} to win, as sportsbooks say the probability of them winning is <strong>${(selectedTeamData.bookProbability * 100).toFixed(0)}%</strong>. But in order to break even, this team has to win <strong>${(selectedTeamData.probability * 100).toFixed(0)}%</strong> of the time. If you bet $90 on this team, you would get $${selectedTeamData.profit} in profit.</p>
    `;

gameResultsDiv.innerHTML = dropdownHTML;
gameResultsDiv.style.display = 'block';
gameResultsDiv.classList.add('show');

}

function hideGameResultsDropdown(gameNumber) {
    const gameResultsDiv = document.getElementById(`game${gameNumber}-results`);
    
    if (!gameResultsDiv) return;
    
    // Remove show class to trigger hide animation
    gameResultsDiv.classList.remove('show');
}


function calculateBet() {
    console.log('Calculate button clicked');
    
    if (selectedTeams.length !== 3) {
        alert('Please select exactly 3 teams from 3 different games.');
        return;
    }
    
    const teamData = [];
    selectedTeams.forEach(teamId => {
        const teamRows = rows.filter(row => row[0] === teamId); 
        teamData.push(...teamRows);
    });

    const stake = 90; // Define the stake value
    
    if (teamData.length === 3) {
        const results = {
            impliedProbability: teamData.map(team => parseFloat(team[3])).reduce((acc, prob) => acc * prob, 1) * 100,
            bookProbability: teamData.map(team => parseFloat(team[4])).reduce((acc, prob) => acc * prob, 1) * 100,
            wagerAmount: teamData.map(team => parseFloat(team[7])).reduce((acc, prob) => acc * prob, 1) * 90,
        };
        
        console.log(`Implied Probability: ${results.impliedProbability.toFixed(1)}%`);
        console.log(`Book Probability: ${results.bookProbability.toFixed(1)}%`);
        
        const resultsElement = document.getElementById('results');
        if (resultsElement) {
            resultsElement.innerHTML = `
                <h3>Results</h3>
                <p>If you bet on a 3-game parlay, then probability of all three teams winning is <span style="font-weight: bold;">${results.bookProbability.toFixed(1)}%</span>. But in order to break even, you have to win this bet <span style="font-weight: bold;">${results.impliedProbability.toFixed(1)}%</span> of the time. If you bet $${stake} on this parlay, you would get $${results.wagerAmount.toFixed(2)}</p>
            `;
        }

        return results;
    } else {
        alert('Error: Could not find data for all selected teams.');
    }
}

function resetSelections() {
    console.log('Reset button clicked');

    // Clear selected teams array
    selectedTeams = [];
 
    // Reset all team buttons to default state
    const allTeamButtons = document.querySelectorAll('[id$="-moneylines"]');
    allTeamButtons.forEach(button => {
        button.classList.remove('selected');
        button.disabled = false;
        button.classList.remove('disabled');
    });

    // Clear results display
    const resultsElement = document.getElementById('results');
    if (resultsElement) {
        resultsElement.innerHTML = '';
    }
    
    console.log('All selections reset');
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadTeams();
});