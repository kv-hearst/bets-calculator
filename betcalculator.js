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
    })
    .catch(error => console.error('Error loading CSV file:', error));

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
}

function toggleTeamSelection(teamId) {
    console.log(`Team ${teamId} button clicked`);
    const buttonElement = document.getElementById(teamId);
    const gameNumber = getGameNumber(teamId);
    
    if (selectedTeams.includes(teamId)) {
        selectedTeams = selectedTeams.filter(team => team !== teamId);
        buttonElement.classList.remove('selected');

        enableAllTeamsInGame(gameNumber);

        if (selectedTeams.length < 3) {
            enableUnselectedTeams();
        }
        
        console.log(`${teamId} deselected from game ${gameNumber}`);
    } else {
 
        if (selectedTeams.length >= 3) {
            return;
        }
        
        selectedTeams.push(teamId);
        buttonElement.classList.add('selected');
        
        disableOtherTeamInGame(teamId, gameNumber);

        if (selectedTeams.length === 3) {
            disableUnselectedTeams();
        }

        console.log(`${teamId} selected from game ${gameNumber}`);
    }
    
    console.log('Currently selected teams:', selectedTeams);
}

function disableUnselectedTeams() {
    // Get all team buttons
    const allTeamButtons = document.querySelectorAll('[id^="team"]'); // Assuming team IDs start with "team"
    
    allTeamButtons.forEach(button => {
        if (!selectedTeams.includes(button.id)) {
            button.disabled = true;
            button.classList.add('disabled'); // Optional: add visual styling
        }
    });
}

// Helper function to re-enable all unselected teams
function enableUnselectedTeams() {
    // Get all team buttons
    const allTeamButtons = document.querySelectorAll('[id^="team"]'); // Assuming team IDs start with "team"
    
    allTeamButtons.forEach(button => {
        if (!selectedTeams.includes(button.id)) {
            button.disabled = false;
            button.classList.remove('disabled'); // Remove visual styling
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
        
        const selectedGames = selectedTeams.map(team => getGameNumber(team));
        const resultsElement = document.getElementById('results');
        if (resultsElement) {
            resultsElement.innerHTML = `
                <p>Selected Teams: ${selectedTeams.join(', ')}</p>
                <p>Implied Probability: ${results.impliedProbability.toFixed(2)}%</p>
                <p>Book Probability: ${results.bookProbability.toFixed(2)}%</p>
            `;
        }
        return results;
    } else {
        alert('Error: Could not find data for all selected teams.');
    }
}

loadTeams();