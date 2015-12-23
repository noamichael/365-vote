(function () {
    var app = angular.module("votingApp", ["chart.js", "firebase"]);
    app.component("votingApp", {
        controller: ["$q", "VotingService", "LoginService", function ($q, VotingService, LoginService) {
                var votingApp = this;
                votingApp.loading = true;
                LoginService.$onAuth(function (user) {
                    var loadingPromises = [];
                    if (user) {
                        loadingPromises = [
                            VotingService.hasVoted(user).then(function (hasVoted) {
                                votingApp.hasVoted = hasVoted;
                                return hasVoted;
                            }),
                            VotingService.getVotingItems().then(function (votingItems) {
                                votingApp.votingItems = votingItems;
                                return votingItems;
                            })
                        ];
                        user.displayName = getName(user);
                        user.profileImageUrl = getProfileImageUrl(user);
                    }
                    votingApp.user = user;
                    $q.all(loadingPromises).then(function () {
                        votingApp.loading = false;
                    });
                });
                this.onVote = function (item) {
                    console.log("Voting for " + item.month);
                    VotingService.voteFor(item, votingApp.user).then(function () {
                        votingApp.hasVoted = true;
                    });
                };
                this.loginWithFacebook = function () {
                    LoginService.$authWithOAuthPopup("facebook");
                };
                this.loginWithGoogle = function () {
                    LoginService.$authWithOAuthPopup("google");
                };
                this.logout = function () {
                    LoginService.$unauth();
                };
            }],
        templateUrl: "app/voting-app.html"
    });

    app.component("votingItems", {
        templateUrl: "app/voting-items/voting-items.html",
        bindings: {
            items: "=",
            preview: "=",
            onVote: "&"
        },
        controller: function () {}
    });

    app.component("votingItem", {
        templateUrl: "app/voting-item/voting-item.html",
        bindings: {
            month: "=",
            even: "=",
            image: "=",
            title: "=",
            preview: "=",
            flickr: "=",
            comments: "=",
            onVote: "&"
        },
        controller: function () {
            var votingItem = this;
            this.goToFlickr = function () {
                if (votingItem.flickr) {
                    window.location.href = votingItem.flickr;
                }
            };
        }
    });
    app.component("votingResults", {
        templateUrl: "app/voting-results/voting-results.html",
        bindings: {
            items: "=",
            user: "=",
            hasVoted: "="
        },
        controller: ["VotingService", function (VotingService) {
                var votingResults = this,
                        chartData = {
                            labels: [],
                            data: [[]]
                        };
                VotingService.getVote(votingResults.user).then(function (vote) {
                    votingResults.vote = vote;
                });
                this.undoVote = function () {
                    VotingService.undoVote(votingResults.user).then(function () {
                        votingResults.hasVoted = false;
                    });
                };
                this.getChart = function () {
                    chartData.labels.length = 0;
                    chartData.data[0].length = 0;
                    votingResults.items.forEach(function (votingItem) {
                        var numberOfVotes = votingItem.votes ? Object.keys(votingItem.votes).length : 0,
                                index = votingItem.monthOrder;
                        chartData.labels[index] = votingItem.month;
                        chartData.data[0][index] = numberOfVotes;
                    });
                    return chartData;
                };
            }]
    });
    function getName(authData) {
        switch (authData.provider) {
            case 'password':
                return authData.password.email.replace(/@.*/, '');
            case 'twitter':
                return authData.twitter.displayName;
            case 'facebook':
                return authData.facebook.displayName;
            case 'google':
                return authData.google.displayName;
        }
    }
    function getProfileImageUrl(authData) {
        switch (authData.provider) {
            case "google":
                return authData.google.profileImageURL;
            case "facebook":
                return authData.facebook.profileImageURL;
        }
    }
})();