var H5P = H5P || {};

H5P.BrainGame = (function ($) {
    /**
     * Constructor function.
     */
    function BrainGame(options, id) {
        this.$ = $(this);
        // Extend defaults with provided options
        this.options = $.extend(true, {}, {
            dbSettings: {
                dbName: 'braingameDB',
                usersdataTblName: 'usersdata',
                attemptsTblName: 'attempts'
            },
            gametitle: 'BrainGame',
            gamelogo: {
                "path": "images/BrainGame.gif",
                "width": 300,
                "height": 300,
                "copyright": {
                    "license": "U"
                }
            },
            gameSettings: {
                correctPoints: 1000,
                correctBonus: 100,
                bonusDuration: 150,
                maxBonus: 2000,
                decreaseDuration: 5
            },
            gameLabels: {
                loggedInAs: 'Logged in as',
                bestScore: 'Best Score',
                currentScore: 'Current Score',
                level: 'Level',
                timer: 'Timer',
                scoreBoard: 'Score Board',
                rank: 'Rank',
                player: 'Player',
                score: 'Score',
                award: 'Award',
                enterButton: 'Enter',
                reportButton: 'Admin Report',
                reportsLabel: 'Attempts History',
                backButton: 'Back',
                beginButton: 'Begin'
            },
            instructions: {
                titleInstructions: 'Instructions',
                textInstructions: 'The instructions text (maximum 500 characters).'
            },
        }, options);
        // Keep provided id.
        this.id = id;

        if (this.options.gamequiz) {
            // Initialize task
            this.gamequiz = H5P.newRunnable(this.options.gamequiz, this.id);

            // Trigger resize events on the task:
            this.on('resize', function (event) {
                this.gamequiz.trigger('resize', event);
            });
        }
    }



    /**
     * Attach function called by H5P framework to insert H5P content into
     * page
     *
     * @param {jQuery} $container
     */
    BrainGame.prototype.attach = function ($container) {
        var self = this;

        // Set class on container to identify it as a braingame
        // container.  Allows for styling later.
        $container.addClass("h5p-bg-wrapper");

        $container.append('<div id="intro"><div id=spanTitle>' + this.options.gametitle + '</div><br><br><img id="imgLogo" src="' + H5P.getPath(this.options.gamelogo.path, this.id) + '"><br><br><div id="buttonsDiv"><button class="button" id="enterButton" type="button">' + this.options.gameLabels.enterButton + '</button><br><br></div></div>');
        $container.append('<div id="instructions"><div id=spanTitle>' + this.options.gametitle + '</div><br><br><p><h1><strong>' + this.options.instructions.titleInstructions + '</strong></h1></p><p><h2>' + this.options.instructions.textInstructions + '</h2></p><br><br><div id="buttonsDiv"><button class="button" id="beginButton" type="button">' + this.options.gameLabels.beginButton + '</button>   <button class="button" id="reportButton" type="button">' + this.options.gameLabels.reportButton + '</button><br><br></div></div>');
        $container.append('<div id="report"><div id=spanTitle>' + this.options.gametitle + '</div><br><br><p><h1><strong>' + this.options.gameLabels.reportButton + '</strong></h1></p><div id="reports"></div><div id="reportData"><table id="reportTable"><thead id="reportTableHeader"><tbody id="reportTableData"></tbody></thead></table></div><div id="repButtonsDiv"><button class="button" id="backButton" type="button">' + this.options.gameLabels.backButton + '</button><br><br></div></div>');
        $container.append('<div id="wall"></div>');
        $container.append('<div id="title"><b>' + this.options.gametitle + '</b></div>');
        $container.append('<div class="cell" id="loggedInAs">' + this.options.gameLabels.loggedInAs + ': <br><span class="data" id="spanLogged"></span></div>');
        $container.append('<div class="cell" id="level"><div class="data" id="divUpLevel" style="display: none;"><i class="fa fa-arrow-circle-up" id="iconUpL"></i> </div>' + this.options.gameLabels.level + ': <span class="data" id="spanNewLevel"></span><span class="data" id="spanLevel"></span></div>');
        $container.append('<div class="cell" id="bestScore"><div class="data" id="divUpScore" style="display: none;"><i class="fa fa-arrow-circle-up" id="iconUpS"></i> </div>' + this.options.gameLabels.bestScore + ': <span class="data" id="spanNewBestScore"></span><span class="data" id="spanBestScore"></span></div>');
        $container.append('<div class="cell" id="currentScore">' + this.options.gameLabels.currentScore + ': <span class="data" id="spanCurrentScore"></span></div>');
        $container.append('<div class="cell" id="timer">' + this.options.gameLabels.timer + ': <span class="data" id="spanTimer"></span></div>');
        $container.append('<div class="cell" id="tableHeader">' + this.options.gameLabels.scoreBoard + '</div>');
        $container.append('<div class="cell" id="tableData"><table id="scoresTable"><thead id="scoresTableHeader"><tbody id="scoresTableData"></tbody></thead><table></div>');
		$container.append('<div class="cell" id="h5p-bg-user-attempts"></div>');
		

        var dbName = this.options.dbSettings.dbName;
        var usersdataTblName = this.options.dbSettings.usersdataTblName;
        var attemptsTblName = this.options.dbSettings.attemptsTblName;
        var rank = this.options.gameLabels.rank;
        var player = this.options.gameLabels.player;
        var score = this.options.gameLabels.score;
        var award = this.options.gameLabels.award;
        var level = this.options.gameLabels.level;
        var currentScore = 0;
        var correctPoints = this.options.gameSettings.correctPoints;
        var correctBonus = this.options.gameSettings.correctBonus;
        var bonusDuration = this.options.gameSettings.bonusDuration;
        var maxBonus = this.options.gameSettings.maxBonus;
        var decreaseDuration = this.options.gameSettings.decreaseDuration;
        var reports = this.options.gameLabels.reportsLabel;
        var curLevel;

        localStorage.setItem("dbName", dbName);
        localStorage.setItem("usersdataTblName", usersdataTblName);
        localStorage.setItem("attemptsTblName", attemptsTblName);

        localStorage.answerCount = 0;
        localStorage.correctCount = 0;
        localStorage.currentScore = 0;
        localStorage.currentBonus = 0;
        localStorage.totalScore = 0;
        localStorage.level = 1;
        // document.getElementById("#spanCurrentScore").innerHTML = localStorage.getItem("lastname");

        $('#divUpLevel').hide();
        $('#divUpScore').hide();
        $('#report').hide();
        $('#reportButton').hide();

        function init() {
            try {
                $.post(document.location.origin + '/moodle/init.php', {
                    postDBName: dbName,
                    postUsersDataName: usersdataTblName,
                    postAttemptsName: attemptsTblName
                },
                function (data) {
                    userData = JSON.parse(data);
                    localStorage.setItem("userdata", JSON.stringify(userData));
                    $('#spanLogged').html('' + userData[5] + '');
                    $('#spanLevel').html('' + userData[9] + '');
                    $('#spanBestScore').html('' + userData[7] + '');
                    $('#spanCurrentScore').html('' + currentScore + '');
                    curLevel = userData[9];
                    curID = userData[0];
                    oldBestScore = userData[7];
					curAttemptID = userData[11];

                    if ((userData[1] == "Admin") || (userData[1] == "admin")) {
                      $('#reportButton').show();
                    }

                    scoreBoard(curID);
                });
                // alert( localStorage.getItem("userdata") );
            } catch (e) {
                console.log(e);
            }
        }


        function scoreBoard(userID) {
            var usID = parseInt(userID);
            try {
                $.post(document.location.origin + '/moodle/scores.php', {
                    postDBName: dbName,
                    postUsersDataName: usersdataTblName,
                    postAttemptsName: attemptsTblName
                },
                function (data) {
                    $('#scoresTableHeader').html('');
                    $('#scoresTableData').html('');
                    var scoresData = JSON.parse(data);
                    localStorage.setItem("scoresdata", JSON.stringify(scoresData));
                    $('#scoresTableHeader').append('<tr><th>' + rank + '</th><th>' + player + '</th><th>' + level + '</th><th>' + score + '</th><th>' + award + '</th>');
                    for (var i = 0; i < scoresData.length; i++) {
                        var stars = '';
                        for (var j = 1; j <= scoresData[i][6]; j++){
                            stars += '<i class="fa fa-star" id="iconStar"></i>';
                        }
                        if (scoresData[i][7] == usID) {
                            if (scoresData[i][6] === 0) {
                                $('#scoresTableData').append('<tr id="thisUser"><td>' + scoresData[i][0] + '</td><td>' + scoresData[i][1] + '</td><td>' + scoresData[i][5] + '</td><td>' + scoresData[i][3] + '</td><td> - </td>');
                            } else {
                                $('#scoresTableData').append('<tr id="thisUser"><td>' + scoresData[i][0] + '</td><td>' + scoresData[i][1] + '</td><td>' + scoresData[i][5] + '</td><td>' + scoresData[i][3] + '</td><td id="tdUpScore">' + stars + '</td>');
                            }
                        } else {
                            if (scoresData[i][6] === 0) {
                                $('#scoresTableData').append('<tr id="otherUser"><td>' + scoresData[i][0] + '</td><td>' + scoresData[i][1] + '</td><td>' + scoresData[i][5] + '</td><td>' + scoresData[i][3] + '</td><td> - </td>');
                            } else {
                                $('#scoresTableData').append('<tr id="otherUser"><td>' + scoresData[i][0] + '</td><td>' + scoresData[i][1] + '</td><td>' + scoresData[i][5] + '</td><td>' + scoresData[i][3] + '</td><td id="tdUpScore">' + stars + '</td>');
                            }
                        }
                    }
                });
                // alert( localStorage.getItem("scoresdata") );
            } catch (e) {
                console.log(e);
            }
        }
		
		function userAttempts(userID) {
			var usID = parseInt(userID);
            try {
                $.post(document.location.origin + '/moodle/user_attempts.php', {
                    postDBName: dbName,
                    postUsersDataName: usersdataTblName,
                    postAttemptsName: attemptsTblName,
					postUserID: usID
                },
                function (data) {
                    var userAttempts = JSON.parse(data);
                    localStorage.setItem("userAttempts", JSON.stringify(userAttempts));
					$('#h5p-bg-user-attempts').append('<h3>' + reports + '<br>' + userData[2] + ' ' + userData[3] +'</h3><br><table><thead><tr width="90%"><th width="10%">α/α</th><th width="20%">Ημερομηνία</th><th width="15%">Διάρκεια</th><th width="15%">' + score + '</th><th width="15%">Σωστές Απαντήσεις</th><th width="10%">' + level + '</th><th width="15%">' + award + '</th></thead><tbody id="userAttemptsTableData"></tbody></table>');
                    for (var i = 0; i < userAttempts.length; i++) {
                        var stars = '';
                        for (var j = 1; j <= userAttempts[i][6]; j++){
                            stars += '<i class="fa fa-star" id="iconStar"></i>';
                        }
                        if (userAttempts[i][7] == curAttemptID) {
                            if (userAttempts[i][6] === 0) {
                                $('#userAttemptsTableData').append('<tr id="thisUser"><td>' + userAttempts[i][0] + '</td><td>' + userAttempts[i][1] + '</td><td>' + userAttempts[i][2] + '</td><td>' + userAttempts[i][3] + '</td><td>' + userAttempts[i][4] + '</td><td>' + userAttempts[i][5] + '</td><td> - </td>');
                            } else {
                                $('#userAttemptsTableData').append('<tr id="thisUser"><td>' + userAttempts[i][0] + '</td><td>' + userAttempts[i][1] + '</td><td>' + userAttempts[i][2] + '</td><td>' + userAttempts[i][3] + '</td><td>' + userAttempts[i][4] + '</td><td>' + userAttempts[i][5] + '</td><td id="tdUpScore">' + stars + '</td>');
                            }
                        } else {
                            if (userAttempts[i][6] === 0) {
                                $('#userAttemptsTableData').append('<tr id="otherUser"><td>' + userAttempts[i][0] + '</td><td>' + userAttempts[i][1] + '</td><td>' + userAttempts[i][2] + '</td><td>' + userAttempts[i][3] + '</td><td>' + userAttempts[i][4] + '</td><td>' + userAttempts[i][5] + '</td><td> - </td>');
                            } else {
                                $('#userAttemptsTableData').append('<tr id="otherUser"><td>' + userAttempts[i][0] + '</td><td>' + userAttempts[i][1] + '</td><td>' + userAttempts[i][2] + '</td><td>' + userAttempts[i][3] + '</td><td>' + userAttempts[i][4] + '</td><td>' + userAttempts[i][5] + '</td><td id="tdUpScore">' + stars + '</td>');
                            }
                        }
                    }
					showReportsButton();
                });
            } catch (e) {
                console.log(e);
            }
		}
		
		function showReportsButton() {
			$('.h5p-sc-result-container').append('<div id="userReportsButtonDiv"><br><p>Υπολογίζουμε το ιστορικό των προσπαθειών σου... </p><br><i class="fa fa-spinner fa-spin" id="spinner"></i></div>');
			delayTransition();
		}
		
		function delayTransition() {
			setTimeout(function(){	
				$('#quizArea').fadeOut(1000);
				$('#h5p-bg-user-attempts').fadeIn(1000);
			}, 5000);
		}
		
        function update() {
            try {
                $.post(document.location.origin + '/moodle/update.php', {
                    postDBName: dbName,
                    postUsersDataName: usersdataTblName,
                    postAttemptsName: attemptsTblName,
                    postAttemptID: curAttemptID,
                    postScore: Number(localStorage.currentScore),
                    postBonus: Number(localStorage.currentBonus),
                    postBadge: Number(localStorage.currentBadge),
                    postQuestions: Number(localStorage.answerCount),
                    postCorrectAnswers: Number(localStorage.correctCount),
                    postLevel: Number(localStorage.level)
                },
                function (data) {
                    scoreBoard(curID);
                    if (localStorage.totalScore > oldBestScore){
                        $('#spanBestScore').hide();
                        $('#divUpScore').show();
                        $('#spanNewBestScore').html('' + localStorage.totalScore + '');
                        $("#iconUpS").animate({fontSize: "3em"});
                        $("#iconUpS").animate({fontSize: "0.5em"});
                        $("#iconUpS").animate({fontSize: "1.5em"});
//                        document.getElementById("level").style.border = "thick green";
                    }
                    if (localStorage.level > curLevel){
                        $('#spanLevel').hide();
                        $('#divUpLevel').show();
                        $('#spanNewLevel').html('' + localStorage.level + '');
                        $("#iconUpL").animate({fontSize: "3em"});
                        $("#iconUpL").animate({fontSize: "0.5em"});
                        $("#iconUpL").animate({fontSize: "1.5em"});
                    }
					userAttempts(curID);
                });
            } catch (e) {
                console.log(e);
            }
        }

        function adminReport() {
            try {
                $.post(document.location.origin + '/moodle/report.php', {
                    postDBName: dbName,
                    postUsersDataName: usersdataTblName,
                    postAttemptsName: attemptsTblName
                },
                function (data) {
                    $('#reportData').html('');
                    reportData = JSON.parse(data);
                    localStorage.setItem("reportdata", JSON.stringify(reportData));
                    var repUser = [];
					var repAttempt = [];
					var repUserId = " ";
                    var repAttemptId = " ";
					var length = reportData.length;
					console.log(length);
					for (i = 0; i < length; i++){
						if ( (reportData[0].UserID) && (reportData[0].UserID != repUserId) ) {
							var j = 1;
							repUserId = reportData[0].UserID;							
							$('#reports').append('<br><tr width="100%"><td id="foo">Report ' + j + '</td><tr>');
							$('#reports').append('<tr width="100%"><th>UserID</th><th>' + player + '</th><th>' + level + '</th><th>' + award + '</th><th>' + score + '</th><th>Duration</th><th>Total Correct Answers</th><th>Total Attempts</th></tr>');							
							$('#reports').append('<tr width="100%"><td>' + reportData[0].UserID + '</td><td>' + reportData[0].Full_Name + '</td><td>' + reportData[0].Level + '</td><td>' + reportData[0].Badge + '</td><td>' + reportData[0].Maxscore + '</td><td>Duration</td><td>' + reportData[0].Answers + '</td><td>' + reportData[0].Tries + '</td></tr>');
						$('#reports').append('<tr width="100%"><th>UserID</th><th>attempt_id</th><th>attempted_at</th><th>duration</th><th>level</th><th>questions</th><th>correct_answers</th><th>score</th><th>bonus</th><th>badge</th></tr>');
							repUser = repUser.concat(reportData.splice(0, 1));
							j++;
						} else if ((reportData[0].user_id) && (reportData[0].user_id == repUserId) && (reportData[0].attempt_id != repAttemptId) ) {
							console.log('if2');
							repAttemptId = reportData[0].attempt_id;
							var stars = '';
							for (var j = 1; j <= reportData[0].badge; j++){
								stars += '<i class="fa fa-star" id="iconStar"></i>';
							}
							if (stars == '') { stars = " - ";};
							$('#reports').append('<tr width="100%"><td>' + reportData[0].user_id + '</td><td>' + reportData[0].attempt_id + '</td><td>' + reportData[0].attempted_at + '</td><td>' + reportData[0].duration + '</td><td>' + reportData[0].level + '</td><td>' + reportData[0].questions + '</td><td>' + reportData[0].correct_answers + '</td><td>' + reportData[0].score + '</td><td>' + reportData[0].bonus + '</td><td>' + stars + '</td></tr>');
							repAttempt = repAttempt.concat(reportData.splice(0, 1));						
						}
					}
                });
            } catch (e) {
                console.log(e);
            }
        }

        function timer(timeInSeconds) {
            function formatTime(num) {
                return (num < 10 ? "0" : "") + num;
            }

            var hours = Math.floor(timeInSeconds / 3600);
            timeInSeconds = timeInSeconds % 3600;

            var minutes = Math.floor(timeInSeconds / 60);
            timeInSeconds = timeInSeconds % 60;

            var seconds = Math.floor(timeInSeconds);

            // Pad the minutes and seconds with leading zeros, if required
            hours = formatTime(hours);
            minutes = formatTime(minutes);
            seconds = formatTime(seconds);

            // Compose the string for display
            var currentTimeString = hours + ":" + minutes + ":" + seconds;

            return currentTimeString;
        }

        var secondsPassed = 0;
        var interval;
        function timeShow () {
            interval = setInterval(function () {
                secondsPassed = secondsPassed + 1;
                $('#spanTimer').text(timer(secondsPassed));
            }, 1000);
            return interval;
        }

        function calculateLevel () {
            localStorage.level = Math.floor((parseInt(userData[8]) + Number(localStorage.correctCount)) / (Number(localStorage.answerCount) + userData[9]));
			if ( Number(localStorage.level) == 0) {localStorage.level = 1};
        }

        var bonusPoints = 0;
        function calculateBonus () {
            if (secondsPassed >= bonusDuration) {
                bonusPoints = 0;
            } else {
                bonusPoints = Math.floor( maxBonus / ( bonusDuration + ( ( curLevel - 1) * decreaseDuration ) ) * ( bonusDuration - secondsPassed ) );
            }
            return bonusPoints;
        }

        var currentBadge = 0;
        function calculateBadge () {
            var percent = (Number(localStorage.correctCount) * 100 / Number(localStorage.answerCount));
            if ( percent >= 90 ) {
                currentBadge = 3;
            } else if (percent >= 75 && percent < 90) {
                currentBadge = 2;
            } else if (percent >= 60 && percent < 75) {
                currentBadge = 1;
            } else {
                currentBadge = 0;
            }
            return currentBadge;
        }

        $('#enterButton').click(function () {
            document.getElementById("report").style.display = "none";			
            document.getElementById("h5p-bg-user-attempts").style.display = "none";
            $('#intro').fadeOut(1500);
            init();
        });

        $('#reportButton').click(function () {
            $('#report').fadeIn(1000);
            $('#instructions').fadeOut(1000);
            adminReport();
        });

        $('#backButton').click(function () {
            $('#instructions').fadeIn(750);
            $('#report').fadeOut(750);
        });

        $('#beginButton').click(function () {
            $('#wall').fadeOut(750);
            $('#instructions').fadeOut(750);
            init();
            timeShow();
        });



        if (this.gamequiz) {
            // Create a container for the task
            var $quizHolder = $('<div class="cell" id="quizArea">Quiz Area</div>');

            // Attach the gamequiz to the container
            this.gamequiz.attach($quizHolder);

            // Append the task container to our content types container
            $container.append($quizHolder);
        }



        H5P.externalDispatcher.on('xAPI', function (event) {
            const result = event.data.statement.result;
            const verb = event.data.statement.verb;
            if (result && result.success === true) {
                const response = event.data.statement.result.response;
                if (response) {
                    localStorage.answerCount = Number(localStorage.answerCount) + 1;
                    localStorage.correctCount = Number(localStorage.correctCount) + 1;
                    localStorage.currentScore = Number(localStorage.currentScore) + correctPoints + ((curLevel - 1) * correctBonus );
                    $('#spanCurrentScore').html('' + localStorage.currentScore + '');
                    console.log("Correct! Current score = " + localStorage.currentScore);
                }
            } else if (result && result.success === false) {
                const response = event.data.statement.result.response;
                if (response) {
                    localStorage.answerCount = Number(localStorage.answerCount) + 1;
                    console.log("Wrong! Current score = " + localStorage.currentScore);
                }
            }
            if (event.getVerb() === "completed") {
                const response = event.data.statement.result.response;
                if (verb) {
                    clearInterval(interval);
                    calculateLevel();
                    localStorage.currentBonus = calculateBonus();
                    localStorage.totalScore = Number(localStorage.currentScore) + Number(localStorage.currentBonus);
                    localStorage.currentBadge = calculateBadge();
                    update();
                    $('#spanCurrentScore').html('' + localStorage.totalScore + '');
                    console.log("END! Current score = " + localStorage.totalScore + ". " + localStorage.correctCount + " out of " + localStorage.answerCount);
                }
            }
        });

        // TODO - need to wait for image beeing loaded
        // For now using timer. Should wait for image is loaded...
        setTimeout(function () {
            self.$.trigger('resize');
        }, 1000);
    };

    return BrainGame;
})(H5P.jQuery);
