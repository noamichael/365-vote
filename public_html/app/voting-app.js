(function () {
    var app = angular.module("votingApp", ["chart.js", "firebase", "ui.bootstrap"]);
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
                    votingApp.processingVote = true;
                    VotingService.voteFor(item, votingApp.user).then(function () {
                        votingApp.processingVote = false;
                        votingApp.hasVoted = true;
                    });
                };
                this.loginWithFacebook = function () {
                    LoginService.$authWithOAuthPopup("facebook");
                };
                this.loginWithGoogle = function () {
                    LoginService.$authWithOAuthPopup("google");
                };
                this.loginWithTwitter = function () {
                    LoginService.$authWithOAuthPopup("twitter");
                };
                this.logout = function () {
                    LoginService.$unauth();
                    votingApp.loading = true;
                    location.reload();
                };
            }],
        templateUrl: "app/voting-app.html"
    });

    app.component("votingItems", {
        templateUrl: "app/voting-items/voting-items.html",
        bindings: {
            items: "=",
            processingVote: "=",
            preview: "=",
            onVote: "&"
        },
        controller: function () {}
    });

    app.component("votingItem", {
        templateUrl: "app/voting-item/voting-item.html",
        bindings: {
            even: "=",
            item: "=",
            processingVote: "=",
            preview: "=",
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
        controller: ["VotingService", "$uibModal", function (VotingService, $uibModal) {
                var votingResults = this,
                        chartData = {
                            labels: [],
                            data: [[]]
                        };

                votingResults.chartTypes = [
                    {label: "Horizontal Bar", value: "HorizontalBar"},
                    {label: "Vertical Bar", value: "Bar"},
                    {label: "Pie", value: "Pie"},
                    {label: "Doughnut", value: "Doughnut"}
                ];
                votingResults.chartType = "HorizontalBar";
                VotingService.getVote(votingResults.user).then(function (vote) {
                    votingResults.vote = vote;
                });

                buildChart();
                votingResults.items.$watch(buildChart);
                votingResults.buildChart = buildChart;

                this.undoVote = function () {
                    votingResults.processingUndo = true;
                    VotingService.undoVote(votingResults.user).then(function () {
                        votingResults.processingUndo = false;
                        votingResults.hasVoted = false;
                    });
                };
                this.onChartClick = function (points, evt) {
                    if (!points || points.length < 1) {
                        return;
                    }
                    var votingItem = getVotingItemByMonthLocal(points[0].label);
                    if (!votingItem) {
                        return;
                    }
                    $uibModal.open({
                        animation: true,
                        templateUrl: 'app/voting-results/voting-item-modal.html',
                        controllerAs: "modalCtrl",
                        backdrop: 'static',
                        controller: [
                            "$uibModalInstance", "votingItem", function ($uibModalInstance, votingItem) {
                                this.votingItem = votingItem;
                                this.close = function () {
                                    $uibModalInstance.close();
                                };
                            }
                        ],
                        resolve: {
                            votingItem: function () {
                                return votingItem;
                            }
                        }
                    });
                };
                this.getChart = function () {
                    return chartData;
                };
                function getVotingItemByMonthLocal(month) {
                    var currentItem;
                    for (var i = 0; i < votingResults.items.length; i++) {
                        currentItem = votingResults.items[i];
                        if (currentItem.month === month) {
                            return currentItem;
                        }
                    }
                    return null;
                }
                function buildChart() {
                    var data;
                    chartData.labels.length = 0;
                    chartData.data[0].length = 0;
                    if (votingResults.chartType === "Pie" || votingResults.chartType === "Doughnut") {
                        data = chartData.data;
                        data.length = 0;
                    } else {
                        chartData.data.length = 0;
                        chartData.data[0] = [];
                        data = chartData.data[0];
                    }
                    votingResults.items.forEach(function (votingItem) {
                        var numberOfVotes = votingItem.votes ? Object.keys(votingItem.votes).length : 0,
                                index = votingItem.monthOrder;
                        chartData.labels[index] = votingItem.month;
                        data[index] = numberOfVotes;
                    });
                    if (votingResults.chartType === "HorizontalBar") {
                        chartData.labels.reverse();
                        data.reverse();
                    }
                }
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
            case "twitter":
                return authData.twitter.profileImageURL;

        }
    }
})();