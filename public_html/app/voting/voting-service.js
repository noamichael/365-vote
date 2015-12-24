(function () {
    angular.module("votingApp").service("VotingService", ["$q", "$firebaseObject", "$firebaseArray",
        function ($q, $firebaseObject, $firebaseArray) {
            var votingService = this,
                    firebaseUrl = "https://365-vote.firebaseio.com/votingItems/",
                    baseVotingItemsRef = new Firebase(firebaseUrl),
                    votingItems = $firebaseArray(baseVotingItemsRef);
            this.hasVoted = function (user) {
                return getUserRef(user).then(function (userRef) {
                    return userRef.votedFor !== undefined;
                });
            };
            this.undoVote = function (user) {
                return unvote(user);
            };
            this.voteFor = function (item, user) {
                return getUserRef(user).then(function (userRef) {
                    if (userRef.votedFor) {
                        unvote(user);
                    }
                    userRef.displayName = user.displayName;
                    userRef.provider = user.provider;
                    userRef.votedFor = item.month.toLowerCase();
                    userRef.$save();
                    return $firebaseObject(new Firebase(firebaseUrl + item.month.toLowerCase() + "/votes/" + user.uid)).$loaded();
                }).then(function (votesRef) {
                    votesRef.user = {
                        displayName: user.displayName,
                        provider: user.provider
                    };
                    return votesRef.$save();
                });

            };
            this.getVote = function (user) {
                return getUserRef(user).then(function (userRef) {
                    return $firebaseObject(new Firebase(firebaseUrl + userRef.votedFor)).$loaded();
                });
            };
            this.getVotingItems = function () {
                return votingItems.$loaded();
            };

            function unvote(user) {
                return getUserRef(user).then(function (userRef) {
                    var votedFor = userRef.votedFor;
                    userRef.votedFor = null;
                    userRef.$save();
                    return $firebaseObject(new Firebase(firebaseUrl + votedFor + "/votes/" + user.uid)).$remove();
                });

            }

            function getUserRef(user) {
                var firebaseUser = "https://365-vote.firebaseio.com/users/" + user.uid;
                return $firebaseObject(new Firebase(firebaseUser)).$loaded();
            }

        }
    ]);
})();