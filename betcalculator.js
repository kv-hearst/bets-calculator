const data = 'data.csv';
let rows = [];
let selectedTeams = [];

// Define which teams belong to which game
const gameTeams = {
    1: ['team1', 'team2'],
    2: ['team3', 'team4'],
    3: ['team5', 'team6'],
    4: ['team7', 'team8'],
    5: ['team9', 'team10']
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

function getGameNumber(teamId) {
    for (let game in gameTeams) {
        if (gameTeams[game].includes(teamId)) {
            return parseInt(game);
        }
    }
    return null;
}

function disableOtherTeamInGame(selectedTeamId, gameNumber) {
    const teamsInGame = gameTeams[gameNumber];
    teamsInGame.forEach(teamId => {
        if (teamId !== selectedTeamId) {
            const buttonElement = document.getElementById(teamId);
            if (buttonElement) {
                buttonElement.disabled = true;
                buttonElement.classList.add('disabled');
            }
        }
    });
}

function enableAllTeamsInGame(gameNumber) {
    const teamsInGame = gameTeams[gameNumber];
    teamsInGame.forEach(teamId => {
        const buttonElement = document.getElementById(teamId);
        if (buttonElement) {
            buttonElement.disabled = false;
            buttonElement.classList.remove('disabled');
        }
    });
}

function loadTeams() {
    for (let i = 1; i <= 10; i++) {
        const teamButton = document.getElementById(`team${i}`);
        if (teamButton) {
            teamButton.addEventListener('click', function() {
                // Only respond if button is not disabled
                if (!teamButton.disabled) {
                    toggleTeamSelection(`team${i}`);
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
                nameContainer.textContent = `${teamData[1]}`;
                moneylineContainer.textContent = `${teamData[5]}`;
            }
        }
    }
}


function toggleTeamSelection(teamId) {
    console.log(`Team ${teamId} button clicked`);
    const moneylineButton = document.getElementById(`${teamId}-moneylines`);

    if (selectedTeams.includes(moneylineButton)) {
        // Deselecting a team
        selectedTeams = selectedTeams.filter(team => team !== teamId);
        moneylineButton.classList.remove('selected');
    }
    else {
        // Selecting a team
        if (selectedTeams.length >= 3) {
            return; // Cannot select more than 3 teams
        }
        selectedTeams.push(teamId);
        moneylineButton.classList.add('selected');
    }
    console.log('Currently selected teams:', selectedTeams);
}


function disableUnselectedTeams() {
    const allTeamButtons = document.querySelectorAll('[id^="team"]');
    
    allTeamButtons.forEach(button => {
        // Disable all unselected teams (ignore current disabled state)
        if (!selectedTeams.includes(button.id)) {
            button.disabled = true;
            button.classList.add('disabled');
        }
    });
}

function enableUnselectedTeams() {
    const allTeamButtons = document.querySelectorAll('[id^="team"]');
    
    allTeamButtons.forEach(button => {
        if (!selectedTeams.includes(button.id)) {
            const gameNumber = getGameNumber(button.id);
            // Check if this game already has a selected team
            const gameHasSelection = gameTeams[gameNumber].some(teamId => selectedTeams.includes(teamId));
            
            // Only enable if this game doesn't have a selection
            if (!gameHasSelection) {
                button.disabled = false;
                button.classList.remove('disabled');
            }
        }
    });
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
    
    if (teamData.length === 3) {
        const results = {
            impliedProbability: teamData.map(team => parseFloat(team[3])).reduce((acc, prob) => acc * prob, 1) * 100,
            bookProbability: teamData.map(team => parseFloat(team[4])).reduce((acc, prob) => acc * prob, 1) * 100
        };
        
        console.log(`Implied Probability: ${results.impliedProbability.toFixed(2)}%`);
        console.log(`Book Probability: ${results.bookProbability.toFixed(2)}%`);
        
        const resultsElement = document.getElementById('results');
        if (resultsElement) {
            resultsElement.innerHTML = `
                <h3>Results</h3>
              
                <p>The probability of you winning for each game:</p>
                
                    ${teamData.map(team => {
                        const gameNumber = getGameNumber(team[0]);
                        return `<li>Game ${gameNumber}: ${team[1]} has a ${parseFloat(team[3] * 100).toFixed(0)}% chance of winning.</li>`;
                    }).join('')}
                

                <p>For the 3-game parlay, the probability of all three teams winning is ${results.bookProbability.toFixed(0)}%. But in order to break even, you have to win this bet ${results.impliedProbability.toFixed(0)}% of the time.</p>
            `;
        }

        const gameResults = document.getElementById('game-results');
        if (gameResults) {
            gameResults.innerHTML = `
            ${teamData.map(team => {
                        const gameNumber = getGameNumber(team[0]);
                        return `<li>Game ${gameNumber}: ${team[1]} has a ${parseFloat(team[3] * 100).toFixed(0)}% chance of winning.</li>`;
                    }).join('')}
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
    const allTeamButtons = document.querySelectorAll('[id^="team"]');
    allTeamButtons.forEach(button => {
        button.classList.remove('selected');
        button.disabled = false;
        button.classList.remove('disabled');
    });

    // Clear results display
    const resultsElement = document.getElementById('results');
    if (resultsElement) {
        resultsElement.innerHTML = '<h3>Results</h3>';
    }
    
    console.log('All selections reset');
}

// Initialize the application
loadTeams();