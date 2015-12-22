(function () {
    var app = angular.module("votingApp", ["ngCookies", "firebase"]);
    app.component("votingApp", {
        controller: ["VotingService", "LoginService", function (VotingService, LoginService) {
                var votingApp = this;
                VotingService.getVotingItems().then(function (votingItems) {
                    votingApp.votingItems = votingItems;
                });
                LoginService.$onAuth(function (user) {
                    votingApp.user = user;
                });
                this.hasVoted = VotingService.hasVoted();
                this.onVote = function (item) {
                    console.log("Voting for " + item.month);
                    VotingService.voteFor(item);
                    votingApp.hasVoted = true;
                };
                this.loginWithFacebook = function(){
                    LoginService.$authWithOAuthPopup("facebook");
                };
                this.loginWithGoogle = function(){
                    LoginService.$authWithOAuthPopup("google");
                };
                this.logout = function(){
                    LoginService.$unauth();
                };
            }],
        templateUrl: "app/voting-app.html"
    });

    app.component("votingItem", {
        templateUrl: "app/voting-item/voting-item.html",
        bindings: {
            month: "=",
            even: "=",
            image: "=",
            flickr: "=",
            comments: "=",
            onVote: "&"
        },
        controller: function () {}
    });
    app.component("votingResults", {
        templateUrl: "app/voting-results/voting-results.html",
        bindings: {
            items: "=",
            hasVoted: "="
        },
        controller: ["VotingService", function (VotingService) {
                var votingResults = this;
                votingResults.vote = VotingService.getVote();
                this.undoVote = function () {
                    VotingService.undoVote();
                    votingResults.hasVoted = false;
                };
            }]
    });
})();