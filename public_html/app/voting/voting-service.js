(function () {
    angular.module("votingApp").service("VotingService", ["$q", "$firebaseObject", "$firebaseArray",
        function ($q, $firebaseObject, $firebaseArray) {
            var cache = {},
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
                    votesRef.$save();
                    votesRef.$destroy();
                    return $q(function (r) {
                        r();
                    });
                });

            };
            this.getVote = function (user) {
                return getUserRef(user).then(function (userRef) {
                    var voteKey = firebaseUrl + userRef.votedFor;
                    if (!cache[voteKey]) {
                        cache[voteKey] = $firebaseObject(new Firebase(firebaseUrl + userRef.votedFor));
                    }
                    return cache[voteKey].$loaded();
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
                    var oldVoteRef = $firebaseObject(new Firebase(firebaseUrl + votedFor + "/votes/" + user.uid));
                    oldVoteRef.$remove();
                    oldVoteRef.$destroy();
                    return oldVoteRef;
                });

            }

            function getUserRef(user) {
                if (!cache.userRef) {
                    var url = "https://365-vote.firebaseio.com/users/" + user.uid;
                    cache.userRef = $firebaseObject(new Firebase(url));
                }
                return cache.userRef.$loaded();
            }

        }
    ]);
})();